// @ts-check

// ESLint公式のルール集。js/ts 両方のコードに適用すべき一般的基本ルール （未定義変数の使用、到達不能コードなど）
import pluginJs from '@eslint/js';

// Vue公式のルール(コンポーネント命名、ディレクティブの使い方など)
// vue-eslint-parser を内部的に、依存関係として持っている
// template, script部分両方の、Vue特有の書き方だけを見る (v-for に key があるかなど)
import pluginVue from 'eslint-plugin-vue';

// Vue公式のTypeScript設定 (TypeScriptとVueの組み合わせ用の推奨設定)
// @typescript-eslint/parser と @typescript-eslint/eslint-plugin を内部的に依存関係として持っている
// .ts ファイルと、.vue ファイル内の <script lang="ts"> の中身の両方を担当する。
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';

// Vueのエコシステムでは、単なる 'eslint-config-prettier' ではなく、
// 便利なエイリアスがついたこちらのパッケージを使うのが一般的です。
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';

import globals from 'globals';

export default defineConfigWithVueTs(
  // グローバルな除外設定 (.eslintignore 相当)
  {
    ignores: ['node_modules/', 'dist/', 'public/'],
  },

  // JSの基本ルール。内部的には files の指定なし。この場合、.vue, .ts などを含む、全てのファイルが対象。
  // files 指定がない = ESLintの設定全体(このファイル)で処理対象となっている全てのファイルが対象、ということ。
  pluginJs.configs.recommended,

  // Vueの推奨ルール (Essential, Recommended, Strong などから選択)
  // files: ['*.vue', '**/*.vue'] のような感じになっており、主に.vueファイルが対象
  ...pluginVue.configs['flat/recommended'],

  // TypeScript推奨ルール (Vueファイル内のTSも含む)
  // 以前の書き方で必要だった「<script lang="ts">の中身をパースする設定」などは、
  // この設定オブジェクトに含まれており、自動的に適用されます。
  // .ts, .tsx などのTypeScriptファイルと.vue ファイル内の <script lang="ts"> 部分が対象。
  vueTsConfigs.recommended,

  // グローバル変数の定義
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // ルールのカスタマイズ
  {
    rules: {
      'no-console': 'off',

      // var は禁止 (const か let にする)
      'no-var': 'error',

      // 再代入しない変数は const にする
      'prefer-const': 'error',

      // 曖昧な比較 (==) を禁止し、=== を強制する
      eqeqeq: ['error', 'always'],

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-explicit-any': 'warn',

      // TypeScriptの「型」をインポートする際に、import type という書き方を強制するルールです。
      '@typescript-eslint/consistent-type-imports': 'error',

      'vue/multi-word-component-names': 'off',

      // @my-event のようにイベント名をハイフン繋ぎに統一
      'vue/v-on-event-hyphenation': 'error',
    },
  },

  skipFormatting,
);

/*
拡張には、「パーサー（翻訳機）」 と 「プラグイン（ルールブック）」 の2種類の拡張がある
  1. Parser (構文解析器):
    ESLint は本来 JS しか読めない。ts を使った Vue プロジェクトの場合には、以下の２つのパーサーが必要。
    1. @typescript-eslint/parser
      .tsファイルと <script lang="ts">の中身の両方をパースする。
      @vue/eslint-config-typescript (ルール集)に同梱されている。
      typescript公式の typescript-eslint にも同梱されているが、vueを使うなら、
      @vue/eslint-config-typescriptを使った方が設定が少し楽になる。

    2. vue-eslint-parser
      .vue ファイルの外側をパースする。
      eslint-plugin-vue (Vue公式のルール集)に同梱されている


  2. Plugin (ルール集):
    「型アノテーションが間違っている」とか「Vueのディレクティブがおかしい」といったチェック項目を追加するために、
    @typescript-eslint/eslint-plugin や eslint-plugin-vue が必要。
*/

/*
コマンドラインツール（npm run lint）
  役割: プロジェクト全体の「一斉検診」です。
  挙動: eslint . のように実行すると、プロジェクト内の全ファイルをスキャンし、ルール違反（未使用の変数がある、Vueの書き方が古いなど）
  をまとめて報告します。
  用途: プロジェクトをビルドする前や、GitHubにコードをアップロード（Push）する前に、「どこかにエラーが残っていないか」を確認するために使う。

VS Code プラグイン（拡張機能）
  役割: 「リアルタイムの監視員」です。
  挙動: 実は保存した時だけでなく、**「コードを書いている最中」**から常にそのファイルを解析しています。
  編集中: 間違ったコードを書くと、保存前でも赤い波線や黄色い波線を出して警告します。
  保存時: 設定（editor.codeActionsOnSave）により、そのファイルに対してだけ eslint --fix（自動修正）を実行します。
*/

