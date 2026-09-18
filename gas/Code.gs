/**
 * 地磅調度出貨管理系統 - Google Apps Script (GAS) 後端 Web API
 * 試算表結構：ID | 客戶名稱 | 工程名稱/地點 | 品名/料別 | 司機姓名 | 車牌號碼 | 實重(KG) | 出場時間 | 建立時間
 */

// 請自訂您的管理員金鑰 (Admin Key)，電腦管理端進行新增、刪除操作時需帶入此金鑰
const ADMIN_SECRET_KEY = SCALE_ADMIN_2026; 

// 取得或初始化工作表
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(地磅出貨資料庫);
  if (!sheet) {
    sheet = ss.insertSheet(地磅出貨資料庫);
  }
  // 如果是空白工作表，自動寫入標題列
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      ID,
      客戶名稱,
      工程名稱/地點,
      品名/料別,
      司機姓名,
      車牌號碼,
      實重(KG),
      出場時間,
      建立時間
    ]);
    sheet.getRange(1, 1, 1, 9).setBackground(#0052cc).setFontColor(#ffffff).setFontWeight(bold);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * 處理 GET 請求 (查閱紀錄)
 * 參數: ?action=getDispatches
 */
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : getDispatches;
    
    if (action === getDispatches) {
      const sheet = getSheet();
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({ success: true, data: [] });
      }

      const rows = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
      const data = rows.map((r, idx) => ({
        id: r[0] || (idx + 1),
        customer: r[1] || ",
 project: r[2] || ,
 material: r[3] || ,
 driver: r[4] || -,
 plate: r[5] || ,
 weight: Number(r[6]) || 0,
 exit_time: r[7] ? String(r[7]) : -,
 created_at: r[8] instanceof Date ? Utilities.formatDate(r[8], Asia/Taipei, yyyy-MM-dd HH:mm:ss) : String(r[8] || )
 })).filter(item => item.plate !== );

 return createJsonResponse({ success: true, data: data });
 }

 return createJsonResponse({ success: false, error: 未知的 GET 操作 });
 } catch (err) {
 return createJsonResponse({ success: false, error: err.toString() });
 }
}

/**
 * 處理 POST 請求 (新增/刪除紀錄 - 需密鑰驗證)
 * 支援 application/json 以及 text/plain (防止 CORS preflight 限制)
 */
function doPost(e) {
 try {
 let payload = {};
 if (e && e.postData && e.postData.contents) {
 payload = JSON.parse(e.postData.contents);
 } else if (e && e.parameter) {
 payload = e.parameter;
 }

 const { action, adminKey } = payload;

 // 驗證管理員密鑰
 if (!adminKey || adminKey !== ADMIN_SECRET_KEY) {
 return createJsonResponse({ success: false, error: 未授權的操作：管理密鑰錯誤或未提供 });
 }

 const sheet = getSheet();

 // 1. 新增車次出貨紀錄
 if (action === addDispatch) {
 const { customer, project, material, driver, plate, weight, exit_time } = payload;
 if (!plate || !weight) {
 return createJsonResponse({ success: false, error: 車牌與重量為必填欄位 });
 }

 const lastRow = sheet.getLastRow();
 let nextId = 1;
 if (lastRow > 1) {
 const lastIdVal = sheet.getRange(lastRow, 1).getValue();
 nextId = (Number(lastIdVal) || (lastRow - 1)) + 1;
 }

 const now = Utilities.formatDate(new Date(), Asia/Taipei, yyyy-MM-dd HH:mm:ss);
 const newRow = [
 nextId,
 customer || ,
 project || ,
 material || ,
 driver || -,
 plate.trim().toUpperCase(),
 Number(weight),
 exit_time || -,
 now
 ];

 sheet.appendRow(newRow);

 return createJsonResponse({
 success: true,
 message: 新增成功,
 data: {
 id: nextId,
 customer,
 project,
 material,
 driver,
 plate,
 weight: Number(weight),
 exit_time,
 created_at: now
 }
 });
 }

    // 2. 刪除指定 ID 紀錄 (單筆或批次)
    if (action === 'deleteDispatch' || action === 'batchDeleteDispatches') {
      const targetIds = Array.isArray(payload.ids)
        ? payload.ids.map(Number).filter(Boolean)
        : (payload.id ? [Number(payload.id)] : []);

      if (targetIds.length === 0) {
        return createJsonResponse({ success: false, error: '請指定要刪除的紀錄 ID' });
      }

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({ success: false, error: '無任何紀錄可刪除' });
      }

      const idTargetSet = {};
      targetIds.forEach(id => { idTargetSet[id] = true; });

      const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let deletedCount = 0;
      // 從最後一列往前刪除，避免列索引位移影響
      for (let i = idValues.length - 1; i >= 0; i--) {
        const rowId = Number(idValues[i][0]);
        if (idTargetSet[rowId]) {
          sheet.deleteRow(i + 2); // 第 2 列開始是資料列
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        return createJsonResponse({ 
          success: true, 
          message: `已成功刪除 ${deletedCount} 筆紀錄`, 
          deletedCount: deletedCount, 
          deletedIds: targetIds 
        });
      } else {
        return createJsonResponse({ success: false, error: '找不到指定的紀錄 ID: ' + targetIds.join(', ') });
      }
    }

 return createJsonResponse({ success: false, error: 未知的 POST 操作:  + action });

 } catch (err) {
 return createJsonResponse({ success: false, error: err.toString() });
 }
}

/**
 * 格式化 JSON 回應
 */
function createJsonResponse(obj) {
 return ContentService.createTextOutput(JSON.stringify(obj))
 .setMimeType(ContentService.MimeType.JSON);
}
