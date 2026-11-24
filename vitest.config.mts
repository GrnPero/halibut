// Halibut: Vitest config (the PHPUnit/Pest equivalent).
//
// Unit tests sit next to the file they test as *.test.ts(x). Integration tests
// (*.integration.test.ts) are excluded here; they get their own config.

import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolves the @/* and @generated/* aliases from tsconfig.json.
    tsconfigPaths: true,
    // Server files start with `import "server-only"`, which throws outside Next.js.
    alias: {
      "server-only": fileURLToPath(
        new URL("./tests/helpers/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [...configDefaults.exclude, "src/**/*.integration.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
});
