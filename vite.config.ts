import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      buffer: "buffer",
      process: "process/browser",
      "json2pptx-schema": fileURLToPath(
        new URL("./src/lib/json2pptx-schema/index.ts", import.meta.url)
      ),
    },
  },
  define: {
    global: "globalThis",
    "process.env": {},
    "process.browser": true,
    "process.version": "\"v16.0.0\"",
  },
  optimizeDeps: {
    include: ["buffer", "process"],
  },
});
