# 地磅調度出貨管理系統 (Scale System)

## 架構說明（方案 B：前後端分離 / 支援 GitHub Pages）
* **前端 (電腦端 / 手機端)**：位於 public/，可直接部署至 **GitHub Pages** 或任何靜態託管空間。
  * 電腦端管理介面：index.html
  * 手機端唯讀加總：iew.html
  * API 動態設定模組：pi-config.js
* **後端 (API & 資料庫)**：server.js + scale.db (SQLite3)，可部署至免費雲端主機（例如 **Render**、**Railway** 或 **Fly.io**）。

---

## 部署至 GitHub Pages 步驟

### 步驟 1：建立 GitHub 儲存庫並推送專案
在專案根目錄開啟終端機執行：
`ash
git init
git add .
git commit -m feat: scale system with GitHub Pages support
git branch -M main
git remote add origin https://github.com/<你的GitHub帳號>/<你的儲存庫名稱>.git
git push -u origin main
`

### 步驟 2：設定 GitHub Pages
1. 開啟 GitHub 儲存庫的 **Settings** -> **Pages**。
2. 在 **Build and deployment** > **Source** 選擇 **Deploy from a branch**。
3. Branch 選擇 main，資料夾選擇 / (root) 或建立 gh-pages 分支推送 public 內容（推薦直接將 public/ 設定或把 public 發布至 gh-pages 分支）。
4. 儲存後將取得網址：https://<你的帳號>.github.io/<專案名>/。

---

## 部署後端 API 至免費雲端 (以 Render 為例)
1. 註冊登入 [Render.com](https://render.com)。
2. 點擊 **New +** -> **Web Service**，選擇連接剛才的 GitHub 儲存庫。
3. 設定：
   - **Runtime**: Node
   - **Build Command**: 
pm install
   - **Start Command**: 
ode server.js
4. 點擊 **Deploy Web Service**。
5. 部署完成後，會獲得一個專屬的後端 API 網址，例如：https://scale-api-xxxx.onrender.com。

---

## 電腦與手機端連線方式
* **電腦端**：開啟 GitHub Pages 網址，在最上方的「**API 伺服器**」欄位輸入雲端 API 網址並點擊「儲存設定」（會自動記錄在瀏覽器）。
* **手機端**：可直接分享包含參數的網址給現場司機/主管：
  `	ext
  https://<你的帳號>.github.io/<專案名>/view.html?api=https://scale-api-xxxx.onrender.com
  `
  打開後手機端便會自動綁定並即時讀取後端資料庫，無需手動輸入網址！
