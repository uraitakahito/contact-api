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
    settings: {
      'import-x/resolver': {
        typescript: true,
        node: true,
      },
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

      //
      // ランタイム構文の拡張を禁止 (erasable syntax only)
      // TypeScript などのスーパーセット言語固有の新しいランタイム機能によってJavaScript の構文を拡張することは、次のような理由により、よくないことと考えられています。
      // - 最も重要なのは、ランタイム構文の拡張は、JavaScript の新しいバージョンの新しい構文と競合する可能性があることです。
      // - 構文の拡張により、JavaScript に不慣れなプログラマーにとって、どこまでがJavaScriptで、どこからが別の言語かを理解するのが困難になります。
      // - 構文の拡張により、スーパーセット言語のコードを受け取り、JavaScript を出力するトランスパイラーの複雑さが増加します。
      //

      // Parameter Properties の禁止
      // https://typescript-eslint.io/rules/parameter-properties/
      '@typescript-eslint/parameter-properties': ['error', { prefer: 'class-property' }],

      // Enums, Export Assignment, Decorators の禁止
      // no-restricted-syntax: https://eslint.org/docs/latest/rules/no-restricted-syntax
      // Enums: https://www.typescriptlang.org/docs/handbook/enums.html
      // Export Assignment: https://www.typescriptlang.org/docs/handbook/modules/reference.html#export--and-import--require
      // Decorators: https://www.typescriptlang.org/docs/handbook/decorators.html
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Enums are not allowed. Use a union type or a const object instead.',
        },
        {
          selector: 'TSExportAssignment',
          message: 'Export assignment (`export =`) is not allowed. Use ES module export syntax instead.',
        },
        {
          selector: 'Decorator',
          message: 'Legacy experimental decorators are not allowed.',
        },
      ],

      // type-only import に副作用を持たせない
      // import type { Foo } from '...' を import { type Foo } from '...' と書かせない
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // type import は必ず import type を使う
      '@typescript-eslint/consistent-type-imports': 'error',

      // 命名規則 (Google TypeScript Style Guide ベース)
      '@typescript-eslint/naming-convention': [
        'warn',
        // 変数: camelCase
        {
          selector: 'variable',
          format: ['camelCase'],
        },
        // boolean 変数: プレフィックス必須
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['camelCase'],
          prefix: ['can', 'did', 'has', 'is', 'must', 'need', 'should', 'will'],
        },
        // enum/enumMember: UPPER_CASE
        {
          selector: ['enum', 'enumMember'],
          format: ['UPPER_CASE'],
        },
        // 関数: camelCase
        {
          selector: 'function',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        // アクセサ: camelCase
        {
          selector: 'accessor',
          format: ['camelCase'],
        },
        // パラメータ: camelCase
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        // クラス: PascalCase
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        // 型エイリアス: PascalCase
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        // 型パラメータ: PascalCase
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
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
      // テストアサーションでの non-null assertion は許容
      '@typescript-eslint/no-non-null-assertion': 'off',
      // テンプレートリテラル内の数値は許容（エラーメッセージの id 埋め込み等）
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
);
