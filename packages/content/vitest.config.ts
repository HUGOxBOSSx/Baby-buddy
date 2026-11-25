import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const pkgDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@baby-buddy/core': path.resolve(pkgDir, '../core/src/index.ts'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
