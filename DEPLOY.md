# デプロイ手順（林ごと）

## 1. GitHub にリポジトリを作成

1. ブラウザで **https://github.com/new?name=hayashigoto** を開く
2. Repository name が `hayashigoto` になっていることを確認
3. **「Add a README file」はチェックしない**（すでにローカルにコミット済みのため）
4. **Create repository** をクリック

## 2. コードを GitHub にプッシュ

リポジトリ作成後、ターミナルで実行：

```bash
cd /Users/home/Desktop/hayashigoto
git push -u origin main
```

## 3. Vercel でデプロイ

### 方法 A: Vercel ダッシュボードから（おすすめ）

1. **https://vercel.com** にログイン
2. **Add New…** → **Project**
3. **Import Git Repository** で `hayashiii-ghub/hayashigoto` を選択
4. Framework Preset: **Vite** のまま **Deploy** をクリック
5. デプロイ完了後、表示される URL が公開サイトになります

### 方法 B: Vercel CLI から

```bash
cd /Users/home/Desktop/hayashigoto
npx vercel login   # 初回のみ。ブラウザでログイン
npx vercel --prod  # 本番デプロイ
```

---

GitHub リポジトリ作成後は、上記の `git push` と Vercel のどちらかの方法でデプロイできます。
