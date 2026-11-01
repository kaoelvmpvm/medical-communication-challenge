# 醫問到底！——病情解碼挑戰

以醫病溝通為主題的繁體中文互動學習網站，使用 Vite + Vanilla JavaScript。
目前提供響應式首頁與三階段模組骨架，**尚未實作完整遊戲、題庫或計分功能**。
網站僅供學習用途，不提供醫療診斷或治療建議。

## 本機開發

使用 Node.js 24（見 `.nvmrc`）及 npm：

```sh
npm ci
npm run dev
```

在終端顯示的網址開啟網站。其他指令：

```sh
npm test        # 驗證三階段順序、模組資料與未開放狀態
npm run build  # 產生 dist/ 正式網站
npm run preview # 本機預覽正式建置結果
```

網站部署路徑固定為 `/medical-communication-challenge/`，由 `vite.config.js` 設定。
不需要 API 金鑰、資料庫或環境變數。

## 專案結構

- `src/main.js`：首頁與導覽。
- `src/style.css`：響應式樣式、鍵盤焦點及減少動態效果支援。
- `src/stages/listen.js`：第一階段「聽懂症狀」。
- `src/stages/ask.js`：第二階段「問對問題」。
- `src/stages/explain.js`：第三階段「說清照護」。
- `src/stages/index.js`：依學習順序匯出模組清單。
- `tests/stages.test.js`：使用 Node.js 內建測試工具驗證模組契約。

目前每個模組只匯出 `id`、`number`、`title`、`subtitle`、`description`、`skill`、`status` 等中繼資料；`status: 'planned'` 表示未開放。未來可在各模組加入遊戲邏輯，再擴充入口與路由。

## GitHub Pages 自動部署

1. 在 GitHub 儲存庫 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**（需要管理權限）。
2. 將程式推送或合併至 `main`；`.github/workflows/deploy.yml` 會依序執行 `npm ci`、測試、建置及部署。也可在 Actions 手動執行工作流程。
3. 首次部署成功後，網站網址為 `https://kaoelvmpvm.github.io/medical-communication-challenge/`。

對 `main` 的 Pull Request 只執行測試與建置，不發布。部署使用 GitHub 提供的 `GITHUB_TOKEN` 與 OIDC，無須建立個人存取權杖。
