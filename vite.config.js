import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  // Builds are served from https://tommyknocker81.github.io/vitaly-output-form-prototype/
  base: command === "build" ? "/vitaly-output-form-prototype/" : "/",
  plugins: [react()],
  server: { port: 5182, strictPort: true },
}));
