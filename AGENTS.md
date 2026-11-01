# 本專案開發與部署規則

- 使用目前的 checkout；不要另建 Git worktree，除非使用者明確要求。
- 開發完成後直接 Commit、Push 至 `kaoelvmpvm/medical-communication-challenge` 的 `main`，由既有 GitHub Actions 部署；不需要建立 PR 或等待手動合併；若使用者在當次任務明確要求 PR 或禁止推送 main，則優先遵循該次要求。
- 推送前先取得遠端 main 的最新狀態，整合其他變更；避免不必要的強制推送。若遇 GitHub 權限或分支保護限制，回報具體阻礙。
- 可以重構或替換程式碼，但必須保留未要求刪除的功能、既定病例資料、三階段流程與教師紀錄系統；不將實際學生紀錄或備份提交至 GitHub。
- 提交前執行 `npm test`、`npm run build`；介面或互動修改亦執行相關 Playwright 驗證。沿用既有 Vite 與 Pages 設定。
- 完成後回報修改結果、測試結果與網站部署狀態；沒有成功驗證的部署不得宣稱已完成。
- 新版本的功能需求以使用者提供的規格為準，不因版本號自行推測或新增功能。
