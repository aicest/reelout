import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    pool: 'threads',
    coverage: {
      provider: 'istanbul',
      skipFull: true,
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'typescript',
          typecheck: {
            enabled: true,
            only: true,
            checker: 'tsc6',
            include: ['**/*.{test,spec}.{ts,tsx}'],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          include: ['**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'server-side-rendering',
          include: ['**/*.{test,spec}.tsx'],
          environment: 'jsdom',
          testTimeout: 15_000,
          setupFiles: [
            fileURLToPath(
              import.meta.resolve('@testing-library/jest-dom/vitest')
            ),
          ],
        },
      },
    ],
  },
})
