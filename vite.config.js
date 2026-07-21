import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// --- Dev-only plugin: make dev URLs identical to production URLs -----------
//
// In production a widget is deployed at   /widget-a/
// but in this repo its source lives at    /widgets/widget-a/
//
// Without this, the launcher page (index.html) would need one set of links
// for dev and another for prod. Instead we rewrite the request as it arrives,
// so a single set of links works everywhere.
function widgetDevUrls() {
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
                // Does the URL start with /widget-<something> ?
                //   ^\/            starts with a slash
                //   widget-[^/?#]+ "widget-" then anything that isn't / ? or #
                //   (\/|$)         followed by a slash, or the end of the URL
                // So "/widget-a/src/main.jsx" matches, "/widgets/..." does not.
                if (/^\/widget-[^/?#]+(\/|$)/.test(req.url)) {
                    // Rewriting req.url is enough: every later middleware, Vite's own
                    // file resolution included, reads this same (now corrected) value.
                    // /widget-a/src/main.jsx  ->  /widgets/widget-a/src/main.jsx
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
