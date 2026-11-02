import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockedTests = [
  'tests/api-tenant-access-guards.test.ts',
  'tests/trema-2027-route.test.ts',
  'tests/pdf-route.test.ts',
  'lib/server-side-audit-log.test.ts',
  'lib/auth.test.ts',
  'lib/authorization-hardening.test.ts',
  'lib/webhook-target.test.ts',
];

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          isolate: false,
          exclude: ['**/node_modules/**', '**/.next/**', ...mockedTests],
        },
      },
      {
        extends: true,
        test: {
          name: 'mocked',
          isolate: true,
          include: mockedTests,
        },
      },
    ],
  },
});


