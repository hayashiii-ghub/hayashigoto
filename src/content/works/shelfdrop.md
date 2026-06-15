---
title: "ShelfDrop — macOS ドラッグシェルフ"
dirName: "shelfdrop"
year: 2026
role: "Solo dev"
stack: ["Swift", "SwiftPM", "macOS", "GitHub Actions"]
github: "https://github.com/hayashiii-ghub/shelfdrop"
description: "Dropover のように、ファイルドラッグ中だけフローティング棚を開き、一時保管・コピー・移動・ZIP 化できる macOS 用シェルフアプリ。"
order: 7
featured: false
category: "個人開発"
---

ShelfDrop は、Dropover のように使える小さな macOS 用シェルフアプリです。ファイルをドラッグしている時だけ画面上にフローティング棚を開き、ファイルやフォルダを一時的に置いたり、コピー、移動、ZIP 化、再ドラッグできます。通常のカーソル移動やシェイクでは棚は開かず、ドラッグ中だけ表示される設計です。

棚に入れた項目はもう一度ドラッグして Finder や他アプリへ取り出せます。その場で開く、Finder 上の場所を表示する、クリップボードへコピーする操作にも対応。複数項目をまとめて指定フォルダへコピー・移動したり、ZIP 化したり、不要な項目をまとめてクリアすることもできます。メニューバーアイコンから棚の表示・非表示・クリア・アプリ終了を操作でき、棚ヘッダーをドラッグすれば事前クリックなしで位置を移動できます。Escape キー、外側クリック、一定時間カーソルが離れた状態で棚を非表示にできます。

## 配布

GitHub Releases から `ShelfDrop-macos.zip` を配布しています。Apple Silicon / Intel 両対応の universal アプリとしてビルドし、タグ push で GitHub Actions が zip を自動アップロードします。ローカルでは `./script/build_and_run.sh` でビルド・起動、`./script/package.sh` で配布用 zip を作成できます。

## 技術スタック

| カテゴリ | ツール | 選定理由 |
|----------|--------|----------|
| 言語 | Swift 5.9+ | macOS ネイティブ UI とドラッグ&ドロップ API を直接扱える |
| ビルド | SwiftPM | Xcode プロジェクト不要で軽量に管理・CI 連携しやすい |
| 対象 OS | macOS 14+ | 最新の AppKit / ドラッグ操作 API を前提に設計 |
| CI/CD | GitHub Actions | タグ push で universal zip を自動ビルド・Release 配布 |
