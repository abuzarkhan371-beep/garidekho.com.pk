import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": `${root}src`,
      // `server-only` is a Next.js build-time guard. Vitest runs in plain Node,
      // so map it to a no-op stub (see tests/stubs/server-only.ts).
      "server-only": `${root}tests/stubs/server-only.ts`,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "dist/**", "test-results/**"],
    clearMocks: true,
    restoreMocks: true,
  },
});
