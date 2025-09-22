import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = dirname(fileURLToPath(new URL("./", import.meta.url)));

export default {
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    coverage: {
      enabled: false,
      provider: "v8",
    },
  },
  resolve: {
    alias: {
      "@": resolve(rootDir, "."),
    },
  },
};
