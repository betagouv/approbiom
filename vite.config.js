import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { readdirSync } from 'node:fs'

const widgetsDir = fileURLToPath(new URL('./widgets', import.meta.url))

// Dev only: serves /widgets/a/ at /a/, the production URL, so the launcher's
// links work in both.
function widgetDevUrls() {
    // Tells widget requests (/accueil/…) apart from Vite's own (/@vite/client,
    // /@fs/…).
    const widgetNames = new Set(
        readdirSync(widgetsDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
    )

    return {
        name: 'widget-dev-urls',

        apply: 'serve',

        configureServer(server) {
            server.middlewares.use((req, _res, next) => {
                const firstSegment = req.url.split('/')[1]

                if (widgetNames.has(firstSegment)) {
                    req.url = '/widgets' + req.url
                }

                next()
            })
        },
    }
}

function devCustomPrintUrls() {
    const { GRIST_DEV_URL } = loadEnv('dev', 'dev', 'GRIST_')
    return {
        name: 'custom-print-urls',
        apply: 'serve',
        configureServer: (server) => {
            const print = server.printUrls
            server.printUrls = () => {
                print()
                server.config.logger.info(`  ➜  Grist:   ${GRIST_DEV_URL}/`)
            }
        },
    }
}

export default defineConfig({
    // Relative asset URLs: the same build is promoted from /staging/ to /prod/
    // by copying.
    base: './',

    plugins: [react(), widgetDevUrls(), devCustomPrintUrls()],

    test: {
        environment: 'jsdom',
    },

    resolve: {
        alias: {
            '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
        },
    },
})
