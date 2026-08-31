// Promotes staging to production: dist/staging/ -> dist/prod/
//
// This is a pure COPY, never a rebuild. Production therefore ships exactly
// the bytes that were validated in the staging Grist document. It works only
// because vite.config.js sets `base: './'`, which makes the built asset URLs
// relative and so independent of the path the widget is served from.
//
// The future GitHub Actions promotion job (workflow_dispatch) will do the
// same copy against the stored staging artifact.

import { cpSync, rmSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const staging = resolve(projectRoot, 'dist/staging')
const prod = resolve(projectRoot, 'dist/prod')

if (!existsSync(staging)) {
    console.error('✗ dist/staging/ not found — run `pnpm build:staging` first.')
    process.exit(1)
}

rmSync(prod, { recursive: true, force: true })
cpSync(staging, prod, { recursive: true })

console.log('✓ Promoted dist/staging/ -> dist/prod/')
