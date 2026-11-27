// Promotes staging to production by copying dist/staging/ to dist/prod/, never rebuilding.
// Relies on `base: './'` in vite.config.js for relative asset URLs.

import { cpSync, rmSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '../..')
const staging = resolve(projectRoot, 'dist/staging')
const prod = resolve(projectRoot, 'dist/prod')

if (!existsSync(staging)) {
    console.error('✗ dist/staging/ not found — run `pnpm build:staging` first.')
    process.exit(1)
}

rmSync(prod, { recursive: true, force: true })
cpSync(staging, prod, { recursive: true })

console.log('✓ Promoted dist/staging/ -> dist/prod/')
