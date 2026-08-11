import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // The HTTP integration suite targets a running dev server; leave plenty
    // of room for auth + DB operations on a cold server.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});