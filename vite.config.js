import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { readdirSync } from 'node:fs'

const widgetsDir = fileURLToPath(new URL('./widgets', import.meta.url))

// --- Dev-only plugin: make dev URLs identical to production URLs -----------
//
// In production a widget is deployed at   /a/
// but in this repo its source lives at    /widgets/a/
//
// Without this, the launcher page (index.html) would need one set of links
// for dev and another for prod. Instead we rewrite the request as it arrives,
// so a single set of links works everywhere.
function widgetDevUrls() {
    // The names of the folders in widgets/, read once at server start. Matching
    // the first path segment against these is what lets us tell a widget page
    // request (/accueil/…) apart from Vite's own internals (/@vite/client,
    // /node_modules/…, /@fs/…) without relying on a naming prefix.
    const widgetNames = new Set(
        readdirSync(widgetsDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
    )

    return {
        name: 'widget-dev-urls',

        // 'serve' = dev server only. This plugin is completely absent from
        // production builds, where the real folder layout already matches.
        apply: 'serve',

        // Vite's dev server is a stack of middlewares: small functions that each
        // get a look at the request before handing it to the next one. Ours runs
        // before Vite resolves the URL to a file on disk.
        configureServer(server) {
            server.middlewares.use((req, _res, next) => {
                // First path segment of the URL: "/accueil/src/main.tsx" -> "accueil".
                const firstSegment = req.url.split('/')[1]

                // Is it one of our widget folders? Then rewrite so Vite finds it.
                // /accueil/src/main.tsx  ->  /widgets/accueil/src/main.tsx
                if (widgetNames.has(firstSegment)) {
                    // Rewriting req.url is enough: every later middleware, Vite's own
                    // file resolution included, reads this same (now corrected) value.
                    req.url = '/widgets' + req.url
                }

                // Hand off to the next middleware. Forgetting next() hangs the request.
                next()
            })
        },
    }
}

export default defineConfig({
    // Relative asset URLs ("./assets/x.js" instead of "/assets/x.js") so the
    // same build works under /staging/widget-a/ AND /prod/widget-a/.
    // This is what lets us promote by copying files instead of rebuilding.
    base: './',

    plugins: [react(), widgetDevUrls()],

    test: {
        environment: 'jsdom',
    },

    resolve: {
        alias: {
            '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
        },
    },
})
