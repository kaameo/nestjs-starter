import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/metadata.ts',
        'src/**/*.module.ts',
        'src/**/*.dto.ts',
        'src/**/*.command.ts',
        'src/**/*.query.ts',
        'src/**/*.spec.ts',
        'src/**/ports/in/**',
        'src/**/ports/out/**',
        'src/**/models/token-pair.model.ts',
        'src/**/schema/**',
        'src/common/types/**',
        'src/**/infrastructure/adapters/drizzle-*',
        'src/**/infrastructure/adapters/nodemailer-*',
        'src/common/config/index.ts',
      ],
      all: true,
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
    setupFiles: ['test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [swc.vite()],
})
