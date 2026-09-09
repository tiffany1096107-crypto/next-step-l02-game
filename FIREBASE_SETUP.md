# Firebase 後續連線說明

目前網站在沒有 Firebase 設定時會維持裝置內紀錄；填入正式設定後，學生完成遊戲時會以匿名登入身分把紀錄送到 Firestore。

## 已建立的專案

- Firebase Project ID：`next-step-l02-game-tw`
- Web App：`Next Step L02 Web`
- 區域規劃：臺灣使用情境，Firestore 預定使用 `asia-east1`
- 本機 Web 設定已存入被 Git 忽略的 `.env.local`，GitHub 中只有空白範本。
- Firestore 規則尚未部署，正式收集資料前需由教師確認下列權限與資料欄位。

## 已準備的安全措施

- 學生端只保存學生代碼，不應輸入姓名、電話或其他個資。
- 匿名登入者只能新增自己的遊戲紀錄，不能讀取全班紀錄。
- 只有存在 `teachers/{uid}` 的教師帳號可讀取或刪除遊戲紀錄。
- 前端不能自行建立或修改教師名單。
- Firebase Web 設定由環境變數提供；服務帳戶、密碼與 Admin SDK 憑證不得提交 GitHub。
- Firebase 未連線、離線或送出失敗時，遊戲仍可使用，紀錄保留在目前瀏覽器。

## 正式啟用順序

1. 教師確認資料欄位與 `firestore.rules` 權限。
2. 部署 Authentication 匿名登入、Firestore 規則與索引。
3. 由 Firebase Console 或受保護的管理程序建立 `teachers/{教師 UID}`；不可由公開網頁建立。
4. 重新建置與部署，使用無痕視窗驗證：學生可送出，但不能讀取紀錄；教師帳號才可查看。
5. 設定資料保存期限及刪除流程，再正式讓學生使用。

## GitHub 自動部署預留

`.github/workflows/firebase-hosting.yml` 為手動啟動流程。正式啟用前需在 GitHub 設定：

- Repository variable：`FIREBASE_PROJECT_ID`
- Repository secret：`FIREBASE_SERVICE_ACCOUNT`
- 六個 `NEXT_PUBLIC_FIREBASE_*` Repository secrets

服務帳戶 JSON 只能放在 GitHub Secret，不可下載到專案資料夾或提交版本控制。
