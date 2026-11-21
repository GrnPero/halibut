// Halibut: Vitest config (the PHPUnit/Pest equivalent).
//
// Unit tests sit next to the file they test as *.test.ts(x). Integration tests
// (*.integration.test.ts) are excluded here; they get their own config.

import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Resolves the @/* and @generated/* aliases from tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [...configDefaults.exclude, "src/**/*.integration.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
});
