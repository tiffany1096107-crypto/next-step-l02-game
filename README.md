# 《下一步，想清楚！》遊戲網站

L2〈無心的錯誤〉三輪對話選擇遊戲公開測試版。

- 公開遊戲：https://next-step-l02-game.spetiffany.chatgpt.site
- Firebase Hosting：https://next-step-l02-game-tw.web.app
- GitHub：https://github.com/tiffany1096107-crypto/next-step-l02-game

## 本機預覽

```powershell
npm install
npm run dev
```

開啟終端機顯示的 Local 網址。

## 已完成

- 七個情境中隨機抽出三個，同一次不重複。
- 三題順序及每題三個選項分別洗牌。
- 即時呈現三思值、安全值、責任值及自然後果。
- 最後結果、三輪回顧及「停、想、做」應對策略。
- 七張情境水彩圖、二十一張選項後果水彩圖、四張結果水彩圖，以及不暗示答案好壞的選項線條圖。
- 每次完成選擇後，依實際選項顯示專屬後果圖；同一情境的三個選項不共用圖片。
- 教師端本機預覽：紀錄、平均數值、題庫啟停與指定必出情境。

結果門檻已調整：只有平均低於 20，或三項中至少兩項低於或等於 10，才進入「無心警報」；一般失誤會優先顯示「再想一步練習生」。

## 資料與 Firebase 狀態

目前紀錄與教師設定仍會保存在同一個瀏覽器，並包含兩筆清楚標示的示範資料。已建立本遊戲專用 Firebase 專案 `next-step-l02-game-tw`、Web App、匿名登入、Firebase Hosting、選用連線、安全規則、環境變數範本與手動部署流程。

Firestore 規則尚未部署；依 Firebase 工作流程，需由教師確認資料欄位及權限後再啟用正式收集。教師登入、跨裝置後台、資料保存期限與刪除方式也須在正式使用前確認。詳細步驟見 `FIREBASE_SETUP.md`。
