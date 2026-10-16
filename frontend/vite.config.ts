import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
export default defineConfig({
  root: import.meta.dirname,
  base: "./",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rolldownOptions: {
      input: Object.fromEntries(
        ["index", "architecture", "board", "demo"].map((page) => [
          page,
          resolve(import.meta.dirname, `${page}.html`),
        ]),
      ),
    },
  },
  server: { host: "127.0.0.1" },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
});
