# Multi-Language Examples

## Java (Spring Boot)

### Terminal
```bash
cd service-name
export SERVICE_URL="https://api.example.com"
./gradlew bootRun
```

### IntelliJ
1. File → Open → Select project
2. Run → Edit Configurations → + → Application
3. Main class: `com.example.Application`
4. Environment variables: `SERVICE_URL=https://api.example.com`
5. Run (Shift+F10)

---

## Node.js

### Terminal
```bash
npm install
export SERVICE_URL="https://api.example.com"
npm start
```

### VS Code
Create `.vscode/launch.json`:
```json
{
  "configurations": [{
    "type": "node",
    "request": "launch",
    "name": "Launch",
    "program": "${workspaceFolder}/src/index.js",
    "env": {"SERVICE_URL": "https://api.example.com"}
  }]
}
```

---

## Python

### Terminal
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export SERVICE_URL="https://api.example.com"
uvicorn main:app --reload
```

---

## Environment Variables Table

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `SERVICE_URL` | API base URL | Yes | - | `https://api.example.com` |
| `SERVICE_TOKEN` | Auth token | Yes | - | `your-token` |
| `PORT` | Server port | No | 8080 | 3000 |
| `LOG_LEVEL` | Log level | No | INFO | DEBUG |
