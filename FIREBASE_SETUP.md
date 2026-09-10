# Firebase 雲端與教師權限說明

## 已正式啟用

- Firebase Project ID：`next-step-l02-game-tw`
- Firestore：`(default)`，區域 `asia-east1`，Standard 免費方案，已開啟刪除保護
- Authentication：匿名登入與 Google 登入
- 第一位管理員：`tiffany1096107@gmail.com`
- Firebase Hosting：https://next-step-l02-game-tw.web.app
- 學生完成遊戲後，紀錄會送到 `gameRecords`；傳送失敗時仍保留瀏覽器本機副本。
- 教師指定情境會存入 `publicSettings/game`，讓不同瀏覽器共用設定。

## 教師申請與批次核准

1. 教師在遊戲首頁選擇「我是教師」，再用 Google 帳號登入。
2. 未授權帳號點選「申請教師權限」，系統建立 `teacherRequests/{uid}`。
3. 管理員登入後開啟「權限申請」，可勾選多人並批次核准或拒絕。
4. 核准後建立 `teacherAccess/{uid}`；該教師重新登入即可查看雲端紀錄與調整情境。

## 安全措施

- 學生端只輸入學生代碼，不應輸入姓名、電話或其他個資。
- 匿名學生只能新增自己的單次紀錄，不能讀取任何遊戲紀錄。
- 只有管理員或已核准教師能讀取遊戲紀錄與修改題目設定。
- 權限申請人只能建立及查看自己的申請，不能核准自己或查看他人申請。
- 只有管理員能批次處理申請及建立教師權限。
- 管理員白名單不能由公開網頁修改。
- Firebase Web 設定由環境變數提供；服務帳戶、密碼與 Admin SDK 憑證不得提交 GitHub。

## 已完成驗證

- 匿名學生可建立符合格式的遊戲紀錄。
- 匿名學生無法讀回自己或他人的遊戲紀錄。
- 已登入使用者可讀取公開題目設定。
- 測試資料已於驗證後刪除。
- 遊戲實際結果資料會先移除未填寫的選用欄位再上傳，避免 Firestore 因 `undefined` 值拒絕整筆紀錄。
- 結果頁會顯示送出成功、送出中或送出失敗；教師每次進入後台都會重新載入雲端紀錄。

## GitHub 自動部署預留

`.github/workflows/firebase-hosting.yml` 為手動啟動流程。GitHub 已設定 Web 環境變數；若要啟用 Actions 自動部署，仍需將服務帳戶 JSON 放入 `FIREBASE_SERVICE_ACCOUNT` Secret。長效憑證不可放進專案檔案。

## 後續管理建議

- 定期檢查並移除不再需要的教師權限。
- 正式大量使用前，決定紀錄保存期限與刪除週期。
- 教師分享時優先使用 Firebase Hosting 網址，以確保 Google 登入來源已受 Firebase 支援。
