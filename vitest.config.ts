import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@baby-buddy/core': path.resolve(rootDir, 'packages/core/src/index.ts'),
      '@baby-buddy/content': path.resolve(rootDir, 'packages/content/src/index.ts'),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts'],
    environment: 'node',
  },
});
