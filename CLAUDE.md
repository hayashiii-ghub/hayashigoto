# 林ごと - Claude Code 用プロジェクト説明

このプロジェクトは「林ごと」フォルダ内のウェブサイトです。

## 技術スタック

- **ビルド**: Vite
- **フロント**: バニラ HTML / CSS / JavaScript（`index.html`, `style.css`, `main.js`）
- パッケージマネージャ: npm または pnpm

## ディレクトリ構成

- `index.html` - エントリの HTML
- `style.css` - スタイル
- `main.js` - メインの JS
- `vite.config.js` - Vite 設定

## 開発コマンド

- `npm run dev` または `pnpm dev` - 開発サーバー起動（ホットリロード）
- `npm run build` または `pnpm build` - 本番ビルド
- `npm run preview` または `pnpm preview` - ビルド結果のプレビュー

## 編集時の注意

- スタイルは `style.css` に追加する
- ページ構造は `index.html`、挙動は `main.js` を編集する
- 新しいページを増やす場合は Vite のマルチページ設定を検討する
