# MajongScoreMemo (SideStore版)

iPhone用の麻雀点数記録アプリ + Windows用UIシミュレーター

## プロジェクト構成

```
├── swift/              # iOS Swiftアプリ (SwiftUI + SwiftData)
├── web-simulator/      # Node.js UIシミュレーター (Vite)
├── .github/workflows/  # CI/CD (テスト→ビルド→IPA生成)
└── README.md
```

## 開発ワークフロー

### 1. UIシミュレーターでローカル開発 (Windows)
```bash
cd web-simulator
npm install
npm run dev
# → http://localhost:5173 でiOS風UIをブラウザ確認
```

### 2. ロジックテスト
```bash
cd web-simulator
npm test
# ScoreCalculator の計算ロジック (Swift版と同一) を検証
```

### 3. ビルド & デプロイ
```bash
git add . && git commit -m "Update" && git push origin main
# → GitHub Actions が自動実行:
#   1. JS版ロジックテスト (sync-check)
#   2. iOS IPA ビルド (unsigned)
```

### 4. iPhoneへのインストール (SideStore)
1. iPhone に SideStore をインストール（初回のみ、[sidestore.io](https://sidestore.io/) 参照）
2. GitHub Actions の Artifacts から IPA をダウンロード
3. IPA を iPhone に転送（AirDrop / iCloud Drive 等）
4. SideStore アプリから IPA をインストール

## 主な機能
- **スコア計算**: 25,000点持ち30,000点返し。五捨六入による精密な端数処理
- **柔軟なルール**: ウマ・オカ、飛び賞（手動確認対応）、チップのカスタマイズ対応
- **同着順位処理**: 席順による厳密な同点時の順位決め
- **成績管理**: プレイヤーごとの通算成績管理
