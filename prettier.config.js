// @ts-check

// 主に、VS Code 内蔵の TypeScript 言語サーバーが @ts-check を見つけると、裏でこっそり ts として扱い、
// 下記 @type ... の型定義を使ってリアルタイムに監視する。つまり、@type ...とセットで使う。
// node_modules の中にある prettier パッケージを見に行き、そこにある Config という型定義を取得。
// それを、直下の export default { ... } オブジェクトに「これはこういう型ですよ」と当てはめる。
// で、この機能は VS Code だけでなく、tsc コマンドラインツールを使う時にも、allowJs: true とすると機能する。

// src の外（ルート直下）に置かれる prettier.config.js, eslint.config.js などは、Viteが動く前や、
// Viteそのものを動かすために、Node.js が直接読み込むファイル。つまり、トランスパイルされない。
// Node.js は .ts を読めないので、トランスパイル不要な .js で書いておく。
// ただし、vite.config については、vite自体が esbuild を持っており、自分でトランスパイルできるので .tsで書いて問題ない。
/** @type {import("prettier").Config} */
export default {
  // '' の方が見た目がスッキリし、HTMLの属性（"）と区別しやすい
  singleQuote: true,
  // 現代のモニター環境では 100〜120 に広げるのが一般的
  printWidth: 100,
  // Vueの中身をインデントする
  vueIndentScriptAndStyle: true,
};

/*
Prettierの整形対象（標準サポート）
  以下は、.prettierignore に書かない限り、保存時に自動で整形される。
  (但し、.git/, node_modules/ 以下の階層はデフォルトで無視するように設定されている。)
  JavaScript系: .js, .jsx, .mjs, .cjs
  TypeScript系: .ts, .tsx
  スタイルシート: .css, .scss, .less
  Web: .html, .vue, .svelte, .json
  ドキュメント: .md (Markdown), .yaml, .yml

整形対象外（デフォルトでは何もしない）
  Python: 対象外です（通常、Pythonは Black や Ruff という別のツールを使います）。
  XML: 対象外です（プラグインを入れれば可能ですが、標準では無視されます）。
  Java / PHP / Ruby / Go / Rust: これらもすべて対象外です。
  プレーンテキスト (.txt): 無視されます。
  設定ファイル (.env, .nvmrc, .gitignore): 無視されます。
*/

/*
動作の仕組み (VS Code（保存時） vs コマンドライン（一括）)
  A. VS Code の自動整形（Ctrl + S）
    対象: 「今保存したそのファイルのみ」
    仕組み: VS Codeが保存を検知 → Prettier拡張機能が起動 → Prettier本体(エンジン)が.prettierignore を確認
    → 無視対象でなければ、そのファイルの中身を .prettier.config.js に基づいて書き換える。
    ポイント: 他のファイル（例えば src/ の中の別ファイル）には一切影響を与えません。

  B. コマンドライン（npm run format など）
    対象: 「指定した範囲内（例：src/）の全ファイル」
    仕組み: Prettierコマンドが起動 → Prettier本体(エンジン)が.prettierignore を確認
    → 指定されたフォルダ（src/）内の全ファイルをスキャン → 対象ファイルを.prettier.config.js に基づいて書き換える。
    ポイント: プロジェクト全体を一度に綺麗にするためのものです。
*/
