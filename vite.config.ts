import { fileURLToPath, URL } from "node:url";
import { readdirSync, writeFileSync, createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, sep } from "node:path";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

const widgetsDir = fileURLToPath(new URL("./grist-widget", import.meta.url));
const widgetEntries = Object.fromEntries(
  readdirSync(widgetsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => [
      d.name,
      fileURLToPath(new URL(`./grist-widget/${d.name}/index.html`, import.meta.url)),
    ]),
);

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    vue(),
    vueDevTools(),
    // GitHub Pages uses Jekyll which silently blocks files starting with '_'.
    // Vite generates _plugin-vue_export-helper.js which would be 404.
    // An empty .nojekyll file disables Jekyll so all files are served as-is.
    {
      name: "github-pages-nojekyll",
      closeBundle() {
        writeFileSync("docs/.nojekyll", "");
      },
    },
    // Vite handles .json natively but not .geojson — this plugin bridges the gap.
    {
      name: "geojson",
      transform(src, id) {
        if (id.endsWith(".geojson")) {
          return { code: `export default ${src}` };
        }
      },
    },
    // Serves dev/ as a static Grist instance on port 5175 during development.
    // apply: "serve" ensures this never runs during `vite build`, so dev/ never ends up in docs/.
    {
      name: "dev-grist-server",
      apply: "serve",
      configureServer(server) {
        const devDir = fileURLToPath(new URL("./dev", import.meta.url));
        const port = 5175;
        const mime: Record<string, string> = {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript",
          ".mjs": "text/javascript",
          ".css": "text/css",
          ".grist": "application/octet-stream",
          ".json": "application/json",
          ".map": "application/json",
          ".ico": "image/x-icon",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
          ".woff": "font/woff",
          ".woff2": "font/woff2",
          ".txt": "text/plain",
        };
        const grist = createServer((req, res) => {
          const url = !req.url || req.url === "/" ? "/index.html" : req.url.split("?")[0];
          const file = join(devDir, url);
          // Prevent path traversal: resolved path must stay inside devDir
          if (!file.startsWith(devDir + sep)) {
            res.writeHead(403);
            res.end("Forbidden");
            return;
          }
          if (!existsSync(file)) {
            res.writeHead(404);
            res.end("Not found");
            return;
          }
          res.setHeader("Content-Type", mime[extname(file)] ?? "application/octet-stream");
          createReadStream(file).pipe(res);
        });
        grist.listen(port);

        const _printUrls = server.printUrls.bind(server);
        server.printUrls = () => {
          _printUrls();
          server.config.logger.info(`  ➜  Grist dev:  http://localhost:${port}/`, { clear: false });
        };
      },
    },
    // Injects the Grist plugin API script into every widget's <head> automatically,
    {
      name: "inject-grist-api",
      transformIndexHtml: {
        order: "pre",
        handler(html, ctx) {
          if (!ctx.filename.includes("grist-widget")) return html;
          return {
            html,
            tags: [
              {
                tag: "script",
                attrs: { src: "https://docs.getgrist.com/grist-plugin-api.js" },
                injectTo: "head",
              },
              {
                tag: "style",
                children: "body { margin: 0; }",
                injectTo: "head",
              },
            ],
          };
        },
      },
    },
  ],
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
  css: {
    // DSFR ships legacy @media (min-width:0\0) IE hacks that LightningCSS rejects as invalid syntax.
    // errorRecovery silently strips them instead of aborting the build.
    lightningcss: {
      errorRecovery: true,
    },
  },
  build: {
    outDir: "docs",
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        ...widgetEntries,
      },
    },
  },
});
