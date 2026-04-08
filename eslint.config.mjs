// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import-x';

export default defineConfig(
  //
  // Global ignores
  //
  {
    ignores: [
      'dist/',
      'eslint.config.mjs',
      '.Trash-*/',
      'vitest.config.ts',
    ],
  },

  //
  // Base configurations
  //
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  //
  // TypeScript parser options + import plugin + custom rules
  //
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'import-x': importPlugin,
    },
    rules: {
      // ES モジュールのファイル拡張子を必須化
      // TypeScript では .ts ファイルを .js 拡張子でインポートするため、
      // ts/tsx は 'never' に設定し、それ以外は 'always' に設定
      'import-x/extensions': [
        'error',
        'always',
        {
          ignorePackages: true,
          // type-only import にも拡張子チェックを適用
          checkTypeImports: true,
          pattern: {
            // .ts/.tsx 拡張子での import を禁止（.js 拡張子で書くのが正しい）
            ts: 'never',
            tsx: 'never',
          },
        },
      ],

      // 匿名デフォルトエクスポートを禁止
      'import-x/no-anonymous-default-export': 'error',

      // Enum 型の使用を禁止（ユニオン型を使用すること）
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            Enum: 'Use union types instead of enums',
          },
        },
      ],

      // type-only import に副作用を持たせない
      // import type { Foo } from '...' を import { type Foo } from '...' と書かせない
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // type import は必ず import type を使う
      '@typescript-eslint/consistent-type-imports': 'error',

      // 命名規則
      '@typescript-eslint/naming-convention': [
        'error',
        // 変数: camelCase / UPPER_CASE (定数) / PascalCase (クラスインスタンス等)
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        // 関数: camelCase / PascalCase (コンポーネント等)
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        // 型 (interface / type alias / class 等): PascalCase
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        // boolean 変数: プレフィックス必須
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['camelCase'],
          prefix: ['is', 'has', 'can', 'should'],
        },
      ],
    },
  },

  //
  // Override for test files
  //
  {
    files: ['**/*.test.ts'],
    rules: {
      // テストでは vi.spyOn 等の unbound method 呼び出しが頻出するため無効化
      '@typescript-eslint/unbound-method': 'off',
      // テストアサーション内の型アサーションは許容
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      // テンプレートリテラル内の数値は許容（エラーメッセージの id 埋め込み等）
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
);
