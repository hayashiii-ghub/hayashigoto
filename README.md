# 林ごと（hayashigoto）

林ごとフォルダで作成しているウェブサイトです。

## セットアップ

```bash
cd /Users/home/Desktop/hayashigoto
npm install
# または
pnpm install
```

## 開発サーバー

```bash
npm run dev
# または
pnpm dev
```

ブラウザで表示される URL（例: http://localhost:5173）を開いて確認できます。

## ターミナルで Claude Code を使って開発する

1. **Claude Code をインストール**（未導入の場合）

   ```bash
   curl -fsSL https://claude.ai/install.sh | bash
   ```

   macOS の場合は Homebrew でも可:

   ```bash
   brew install --cask claude-code
   ```

2. **林ごとフォルダに移動して Claude Code を起動**

   ```bash
   cd /Users/home/Desktop/hayashigoto
   claude
   ```

3. **初回のみログイン**

   起動後、プロンプトに従って `/login` を実行し、Claude のアカウント（Pro / Console / クラウドプロバイダー）でログインします。

4. **開発の進め方**

   - 別のターミナルで `npm run dev` または `pnpm dev` を実行し、開発サーバーを起動しておく
   - Claude Code のプロンプトで「トップに〇〇のセクションを追加して」「style.css でヘッダーを青にして」など、やりたいことを日本語で指示する
   - 変更はファイルに反映されるので、ブラウザで確認する

## よく使う Claude Code コマンド

- `claude` - 対話モード開始
- `claude "トップページに自己紹介を追加して"` - 単発タスク
- `/help` - ヘルプ
- `exit` または Ctrl+C - 終了
