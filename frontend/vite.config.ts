import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

// Static documents work directly from docs and are copied unchanged into dist.
const documentFiles = [
  "planning.html",
  "architecture.html",
  "architecture.md",
  "assets/document.css",
  "assets/planning.css",
  "assets/architecture.css",
];
function staticDocuments(): Plugin {
  return {
    name: "static-documents",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const file = documentFiles.find(
          (name) => req.url?.split("?")[0] === `/docs/${name}`,
        );
        if (!file) return next();
        res.setHeader(
          "Content-Type",
          file.endsWith(".html")
            ? "text/html; charset=utf-8"
            : file.endsWith(".css")
              ? "text/css; charset=utf-8"
              : "text/plain; charset=utf-8",
        );
        res.end(readFileSync(new URL(`../docs/${file}`, import.meta.url)));
      });
    },
    generateBundle() {
      for (const file of documentFiles) {
        this.emitFile({
          type: "asset",
          fileName: `docs/${file}`,
          source: readFileSync(new URL(`../docs/${file}`, import.meta.url)),
        });
      }
    },
  };
}
export default defineConfig({
  root: import.meta.dirname,
  cacheDir: process.env.VITE_CACHE_DIR || "node_modules/.vite",
  base: "/",
  plugins: [react(), tailwindcss(), staticDocuments()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: { host: "localhost", port: 5173 },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
});
