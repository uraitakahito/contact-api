import { defineConfig } from 'vitest/config';

// DB を使うテストと使わないテストを分離する。
// DB テストは共有の PostgreSQL に対して afterEach で TRUNCATE するため、
// 並列実行するとテスト間でデータが干渉して不安定になる。
// singleFork で単一プロセスに強制し、直列実行を保証する。
export default defineConfig({
  test: {
    testTimeout: 10000,
    env: {
      LOG_LEVEL: 'silent',
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: [
            'src/domain/**/*.test.ts',
            'src/application/**/*.test.ts',
            'src/presentation/error-handler.test.ts',
            'src/presentation/validation-message-formatter.test.ts',
          ],
          sequence: { groupOrder: 1 },
        },
      },
      {
        test: {
          name: 'db',
          include: [
            'src/infrastructure/**/*.test.ts',
            'src/presentation/**/*.test.ts',
          ],
          pool: 'forks',
          maxWorkers: 1,
          isolate: false,
          sequence: { groupOrder: 2 },
        },
      },
    ],
  },
});
