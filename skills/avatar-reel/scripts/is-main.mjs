// True when `metaUrl` (pass import.meta.url) is the script node was launched with.
// Compares real paths so spaces (%20) and symlinked installs still match.
import { fileURLToPath } from 'node:url'
import { realpathSync } from 'node:fs'
export const isMain = (metaUrl) => fileURLToPath(metaUrl) === realpathSync(process.argv[1])
