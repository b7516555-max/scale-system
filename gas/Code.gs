/**
 * 地磅調度出貨管理系統 - Google Apps Script (GAS) 後端 Web API
 */

const ADMIN_SECRET_KEY = 'SCALE_ADMIN_2026';

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('地磅出貨資料庫');
  if (!sheet) {
    sheet = ss.insertSheet('地磅出貨資料庫');
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID','客戶名稱','工程名稱/地點','品名/料別','司機姓名','車牌號碼','實重(KG)','出場時間','建立時間']);
    sheet.getRange(1,1,1,9).setBackground('#0052cc').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('工程設定');
  if (!sheet) {
    sheet = ss.insertSheet('工程設定');
    sheet.appendRow(['工程名稱','預計總量(噸)','等電話車數','更新時間']);
    sheet.getRange(1,1,1,4).setBackground('#0052cc').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : 'getDispatches';

    if (action === 'getDispatches') {
      const sheet = getSheet();
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return createJsonResponse({ success: true, data: [] });
      const rows = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
      const data = rows.map((r, idx) => ({
        id: r[0] || (idx + 1),
        customer: r[1] || '',
        project: r[2] || '',
        material: r[3] || '',
        driver: r[4] || '-',
        plate: r[5] || '',
        weight: Number(r[6]) || 0,
        exit_time: r[7] ? String(r[7]) : '-',
        created_at: r[8] instanceof Date ? Utilities.formatDate(r[8],'Asia/Taipei','yyyy-MM-dd HH:mm:ss') : String(r[8] || '')
      })).filter(item => item.plate !== '');
      return createJsonResponse({ success: true, data: data });
    }

    if (action === 'getProjectSettings') {
      const sheet = getSettingsSheet();
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return createJsonResponse({ success: true, data: {} });
      const rows = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
      const data = {};
      rows.forEach(r => {
        const pName = String(r[0] || '').trim();
        if (pName) {
          data[pName] = {
            target: Number(r[1]) || 0,
            waitPhone: String(r[2] || '').trim(),
            updatedAt: String(r[3] || '')
          };
        }
      });
      return createJsonResponse({ success: true, data: data });
    }

    return createJsonResponse({ success: false, error: '未知的 GET 操作' });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }
    const { action, adminKey } = payload;
    if (!adminKey || adminKey !== ADMIN_SECRET_KEY) {
      return createJsonResponse({ success: false, error: '未授權的操作：管理密鑰錯誤或未提供' });
    }

    const sheet = getSheet();

    if (action === 'addDispatch') {
      const { customer, project, material, driver, plate, weight, exit_time } = payload;
      if (!plate || !weight) return createJsonResponse({ success: false, error: '車牌與重量為必填欄位' });
      const lastRow = sheet.getLastRow();
      let nextId = 1;
      if (lastRow > 1) {
        const lastIdVal = sheet.getRange(lastRow, 1).getValue();
        nextId = (Number(lastIdVal) || (lastRow - 1)) + 1;
      }
      const now = Utilities.formatDate(new Date(),'Asia/Taipei','yyyy-MM-dd HH:mm:ss');
      sheet.appendRow([nextId, customer||'', project||'', material||'', driver||'-', plate.trim().toUpperCase(), Number(weight), exit_time||'-', now]);
      return createJsonResponse({ success: true, message: '新增成功', data: { id: nextId, customer, project, material, driver, plate, weight: Number(weight), exit_time, created_at: now } });
    }

    if (action === 'deleteDispatch' || action === 'batchDeleteDispatches') {
      const targetIds = Array.isArray(payload.ids) ? payload.ids.map(Number).filter(Boolean) : (payload.id ? [Number(payload.id)] : []);
      if (targetIds.length === 0) return createJsonResponse({ success: false, error: '請指定要刪除的紀錄 ID' });
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return createJsonResponse({ success: false, error: '無任何紀錄可刪除' });
      const idTargetSet = {};
      targetIds.forEach(id => { idTargetSet[id] = true; });
      const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let deletedCount = 0;
      for (let i = idValues.length - 1; i >= 0; i--) {
        if (idTargetSet[Number(idValues[i][0])]) { sheet.deleteRow(i + 2); deletedCount++; }
      }
      if (deletedCount > 0) return createJsonResponse({ success: true, message: `已成功刪除 ${deletedCount} 筆紀錄`, deletedCount, deletedIds: targetIds });
      return createJsonResponse({ success: false, error: '找不到指定的紀錄 ID: ' + targetIds.join(', ') });
    }

    if (action === 'updateDispatch') {
      const { id, customer, project, material, driver, plate, weight, exit_time } = payload;
      if (!id) return createJsonResponse({ success: false, error: '請指定要修改的紀錄 ID' });
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return createJsonResponse({ success: false, error: '無任何紀錄可修改' });
      const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let targetRow = -1;
      for (let i = 0; i < idValues.length; i++) {
        if (Number(idValues[i][0]) === Number(id)) { targetRow = i + 2; break; }
      }
      if (targetRow === -1) return createJsonResponse({ success: false, error: '找不到指定的紀錄 ID: ' + id });
      const now = Utilities.formatDate(new Date(),'Asia/Taipei','yyyy-MM-dd HH:mm:ss');
      sheet.getRange(targetRow, 2, 1, 7).setValues([[customer||'', project||'', material||'', driver||'-', plate ? plate.trim().toUpperCase() : '', Number(weight)||0, exit_time||'-']]);
      return createJsonResponse({ success: true, message: '修改成功', data: { id: Number(id), customer, project, material, driver, plate, weight: Number(weight), exit_time, updated_at: now } });
    }

    if (action === 'setProjectSettings') {
      const { project, target, waitPhone } = payload;
      if (!project) return createJsonResponse({ success: false, error: '請指定工程名稱' });
      const settingsSheet = getSettingsSheet();
      const lastRow = settingsSheet.getLastRow();
      const pName = String(project).trim();
      let foundRow = -1;
      if (lastRow > 1) {
        const names = settingsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < names.length; i++) {
          if (String(names[i][0]).trim() === pName) { foundRow = i + 2; break; }
        }
      }
      const now = Utilities.formatDate(new Date(),'Asia/Taipei','yyyy-MM-dd HH:mm:ss');
      const rowData = [pName, Number(target)||0, String(waitPhone||'').trim(), now];
      if (foundRow > 0) {
        settingsSheet.getRange(foundRow, 1, 1, 4).setValues([rowData]);
      } else {
        settingsSheet.appendRow(rowData);
      }
      return createJsonResponse({ success: true, message: '工程設定已儲存', project: pName, target: Number(target)||0, waitPhone: String(waitPhone||'').trim() });
    }

    return createJsonResponse({ success: false, error: '未知的 POST 操作: ' + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
