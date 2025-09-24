import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = dirname(fileURLToPath(new URL("./", import.meta.url)));

export default defineConfig({
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["app/**/*.test.tsx", "jsdom"],
      ["lib/mobile/**/*.test.ts", "jsdom"],
    ],
    include: ["lib/**/*.test.ts", "app/**/*.test.tsx", "tests/**/*.test.ts"],
    coverage: {
      enabled: false,
      provider: "v8",
    },
    alias: [
      {
        find: /^@\//,
        replacement: `${resolve(rootDir, ".")}/`,
      },
      {
        find: /^@$/,
        replacement: resolve(rootDir, "."),
      },
    ],
  },
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: `${resolve(rootDir, ".")}/`,
      },
      {
        find: /^@$/,
        replacement: resolve(rootDir, "."),
      },
    ],
  },
});
