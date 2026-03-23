---
title: "図面記号検出システム"
dirName: "drawing-detector"
year: 2025
role: "System Design / AI Direction"
stack: ["Claude Code", "Python", "Gemini API", "Neon"]
description: "Claude Codeをエージェントとしてワークフローに組み込み、図面画像から特定記号を自動検出・抽出する社内システム。"
order: 4
---

Claude Codeをエージェントとして実行ワークフローに組み込んだ、図面画像からの記号自動検出・抽出システムです。

図面画像のアップロードをトリガーに、Claude Codeが画像の分割処理、Gemini APIのvision機能による記号検出、結果のNeonデータベースへの蓄積までを一連のワークフローとしてエージェント的に実行します。
