#!/usr/bin/env python3
"""Word-level transcript -> JSON {"words":[{"word","start","end"}]}.

  transcribe.py <media> <out.json> [--engine faster-whisper|fish] [--model small] [--lang en]

faster-whisper runs locally (default, no key). fish uses Fish Audio ASR (FISH_API_KEY as a 1Password reference in .env).
To add an engine: write a function returning the word list and register it in ENGINES.
"""
import argparse, json, os, sys, uuid, urllib.request
from pathlib import Path


def load_env():
    for d in (Path.cwd(), Path(__file__).resolve().parent.parent):
        p = d / ".env"
        if p.exists():
            for line in p.read_text().splitlines():
                k, _, v = line.partition("=")
                if k.strip() and v.strip() and k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip().strip("'\"")


def secret(name):
    """env var -> `op read` of <NAME>_OP_REF / op:// value -> exit with setup hint. Mirrors scripts/env.mjs."""
    import subprocess
    v = os.environ.get(name, "")
    default = f"op://{os.environ.get('OP_VAULT', 'app-secrets')}/{name}/{os.environ.get('OP_FIELD', 'credential')}"
    ref = os.environ.get(name + "_OP_REF") or (v if v.startswith("op://") else "") or default
    if v and not v.startswith("op://"):
        return v
    try:
        r = subprocess.run([os.environ.get("OP_BIN", "op"), "read", "--no-newline", ref], capture_output=True, text=True)
    except FileNotFoundError:
        sys.exit("1Password CLI `op` not found (brew install 1password-cli)")
    if r.returncode:
        sys.exit(f"`op read` failed for {name} ({ref}); check `op whoami` and the reference path")
    return r.stdout


def faster_whisper(media, a):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("faster-whisper missing: run scripts/setup.sh (or: pip install faster-whisper)")
    import subprocess, numpy as np
    # decode with ffmpeg ourselves: faster-whisper's PyAV decoding breaks on some av versions
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", media, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    model = WhisperModel(a.model, compute_type="int8")
    segs, _ = model.transcribe(audio, word_timestamps=True, language=a.lang, vad_filter=True)
    return [{"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
            for s in segs for w in (s.words or []) if w.word.strip()]


def fish(media, a):
    key = secret("FISH_API_KEY")
    b = uuid.uuid4().hex
    data = Path(media).read_bytes()
    fields = {"language": a.lang or "", "ignore_timestamps": "false"}
    body = b"".join(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k, v in fields.items())
    body += f'--{b}\r\nContent-Disposition: form-data; name="audio"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode() + data + f"\r\n--{b}--\r\n".encode()
    req = urllib.request.Request("https://api.fish.audio/v1/asr", body, {"Authorization": f"Bearer {key}", "Content-Type": f"multipart/form-data; boundary={b}"})
    res = json.load(urllib.request.urlopen(req, timeout=300))
    # Fish returns segments with start/end; spread words evenly inside each segment (no word-level timing).
    out = []
    for s in res.get("segments", []):
        ws = s["text"].split()
        if not ws:
            continue
        step = (s["end"] - s["start"]) / len(ws)
        out += [{"word": w, "start": round(s["start"] + i * step, 3), "end": round(s["start"] + (i + 1) * step, 3)} for i, w in enumerate(ws)]
    return out


ENGINES = {"faster-whisper": faster_whisper, "fish": fish}

if __name__ == "__main__":
    load_env()
    p = argparse.ArgumentParser()
    p.add_argument("media"); p.add_argument("out")
    p.add_argument("--engine", default=os.environ.get("TRANSCRIBER", "faster-whisper"), choices=ENGINES)
    p.add_argument("--model", default="small"); p.add_argument("--lang", default="en")
    a = p.parse_args()
    words = ENGINES[a.engine](a.media, a)
    if not words:
        sys.exit("no words transcribed")
    Path(a.out).write_text(json.dumps({"engine": a.engine, "words": words}, indent=1))
    print(f"{len(words)} words -> {a.out}")
