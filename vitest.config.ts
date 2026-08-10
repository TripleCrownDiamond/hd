import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
    // `node_modules*` also covers the `node_modules.corrupt-*` backup folder,
    // whose vendored test files were being collected and failing the run.
    exclude: ["**/node_modules*/**", ".next/**", "tests/e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `import "server-only"` is a Next build-time guard with no runtime
      // module behind it; Vite cannot resolve it, so unit tests for any
      // server module fail at import. Point it at an empty stub.
      "server-only": path.resolve(__dirname, "./src/test/server-only-stub.ts"),
    },
  },
});
