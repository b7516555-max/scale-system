# 地磅調度出貨管理系統 - Google Apps Script (GAS) 部署手冊

本系統現已完全轉移至 **Google Apps Script (GAS) + Google Sheets (試算表)** 作為無伺服器雲端後端，不需支付任何伺服器費用且自動雲端備份！

---

## ⚡ 三步驟快速部署 Google Apps Script

### 步驟 1：建立 Google 試算表
1. 打開 [Google 試算表 (Google Sheets)](https://sheets.new) 建立一份新試算表。
2. 將試算表命名為：地磅出貨資料庫。

### 步驟 2：貼上後端程式碼
1. 點擊頂部功能表：**擴充功能 (Extensions)** -> **Apps Script**。
2. 清空編輯器預設內容，開啟專案中的 gas/Code.gs 並將內容全部複製貼入。
3. （可選）您可以修改 Code.gs 第 8 行的 ADMIN_SECRET_KEY 管理員密鑰（預設為 SCALE_ADMIN_2026）。
4. 點擊上方的「💾 儲存專案 (Save)」。

### 步驟 3：發布為 Web 應用程式 (Web App)
1. 點擊右上角藍色按鈕 **「部署 (Deploy)」** -> **「新增部署 (New deployment)」**。
2. 點擊左側齒輪 ⚙️ 圖示，選擇 **「網路應用程式 (Web app)」**。
3. 設定內容如下（非常重要）：
   - **說明 (Description)**：地磅系統 API
   - **執行身分 (Execute as)**：選擇 **「我 (Me)」**
   - **誰可以存取 (Who has access)**：**務必選擇「所有人 (Anyone)」**（這樣手機端現場人員才能免登入直接讀取）。
4. 點擊 **「部署 (Deploy)」**。
5. （初次執行）系統會彈出「需要授權」視窗：
   - 點擊「查看權限 (Review permissions)」
   - 選擇您的 Google 帳號
   - 點擊「進階 (Advanced)」-> 點擊最下方「前往『未命名專案』(不安全) / Go to ... (unsafe)」
   - 點擊「允許 (Allow)」。
6. 複製彈出的 **Web 應用程式網址 (Web App URL)**，格式通常為：
   https://script.google.com/macros/s/AKfycbx.../exec

---

## 🔗 前端系統存取與自動連線

### 1. 電腦端管理介面
- 網址：[https://b7516555-max.github.io/scale-system/](https://b7516555-max.github.io/scale-system/)
- 初次開啟時，點擊右上角 **「⚙️ API 與金鑰設定」**：
  - 貼上剛才複製的 GAS Web App URL。
  - 輸入管理密鑰（預設：SCALE_ADMIN_2026）。
  - 點擊儲存，系統會自動儲存於瀏覽器並即時連線！
- 或直接使用帶參數網址開啟（免手動設定）：
  `	ext
  https://b7516555-max.github.io/scale-system/?api=YOUR_GAS_URL&key=SCALE_ADMIN_2026
  `

### 2. 手機端唯讀查閱介面
- 提供給現場司機或主管的免設定專屬連結：
  `	ext
  https://b7516555-max.github.io/scale-system/view.html?api=YOUR_GAS_URL
  `
- 現場人員點開網址即可直接看到最新的過磅卡片清單、單手點擊卡片切換勾選，底部的紅色總噸數會即時加總！
