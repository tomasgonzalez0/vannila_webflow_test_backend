import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    coverage: { reporter: ["text", "html"] },
  },
  resolve: { alias: { "@": resolve(process.cwd(), "src") } },
});
