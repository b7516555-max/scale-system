/**
 * api-config.js: 全域 API 與金鑰管理器 (支援 GAS Web App 與 本地模式)
 */
(function() {
  const STORAGE_API_KEY = 'scale_gas_api_url';
  const STORAGE_ADMIN_KEY = 'scale_admin_key';

  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyI_iwjcAt55h3fJJ6_cOH2uTibyhjxdB84KxyiYJk2ZFxsLVjyjGe6wVfrMGaCKytYBQ/exec';

  // 取得 API Base URL (優先順序: URL 參數 > localStorage > 預設網址)
  function getApiBaseUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramApi = urlParams.get('api');
    if (paramApi) {
      localStorage.setItem(STORAGE_API_KEY, paramApi.trim());
      return paramApi.trim();
    }
    return localStorage.getItem(STORAGE_API_KEY) || DEFAULT_GAS_URL;
  }

  function setApiBaseUrl(url) {
    if (!url) {
      localStorage.removeItem(STORAGE_API_KEY);
    } else {
      localStorage.setItem(STORAGE_API_KEY, url.trim());
    }
  }

  // 取得 Admin Key (優先順序: URL 參數 > localStorage > 預設)
  function getAdminKey() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramKey = urlParams.get('key');
    if (paramKey) {
      localStorage.setItem(STORAGE_ADMIN_KEY, paramKey.trim());
      return paramKey.trim();
    }
    return localStorage.getItem(STORAGE_ADMIN_KEY) || 'SCALE_ADMIN_2026';
  }

  function setAdminKey(key) {
    if (!key) {
      localStorage.removeItem(STORAGE_ADMIN_KEY);
    } else {
      localStorage.setItem(STORAGE_ADMIN_KEY, key.trim());
    }
  }

  // 發起 GET 請求 (查詢出貨列表)
  async function fetchDispatches() {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      // 若尚未設定，回傳示範或空資料
      throw new Error('未設定 GAS Web App API 網址，請先至右上角設定！');
    }

    const separator = baseUrl.includes('?') ? '&' : '?';
    const requestUrl = baseUrl + separator + 'action=getDispatches&_t=' + Date.now();
    
    const res = await fetch(requestUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });

    if (!res.ok) {
      throw new Error('HTTP 錯誤: ' + res.status);
    }
    const result = await res.json();
    const list = result.data || [];
    // 清理資料格式，轉型字串避免如數字 driver 或特殊物件導致 includes 崩潰
    return list.map(item => ({
      ...item,
      customer: item.customer != null ? String(item.customer) : '',
      project: item.project != null ? String(item.project) : '',
      material: item.material != null ? String(item.material) : '',
      driver: item.driver != null ? String(item.driver) : '-',
      plate: item.plate != null ? String(item.plate) : '',
      weight: Number(item.weight) || 0,
      exit_time: formatSimpleTime(item.exit_time)
    }));
  }

  // 格式化時間為 HH:mm 簡易顯示 (例如: 10:10)
  function formatSimpleTime(val) {
    if (!val) return '-';
    const str = String(val).trim();
    if (!str || str === '-') return '-';
    // 若包含時間部分 (如 1899 ... 10:10:00 GMT... 或 10:10:00 或 10:10)
    const match = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (match) {
      const hh = match[1].padStart(2, '0');
      const mm = match[2];
      return `${hh}:${mm}`;
    }
    return str;
  }

  // 發起 POST 請求 (新增或刪除)
  async function postAction(actionName, payload = {}) {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      throw new Error('未設定 GAS Web App API 網址，請先至右上角設定！');
    }

    const bodyData = {
      action: actionName,
      adminKey: getAdminKey(),
      ...payload
    };

    // Google Apps Script doPost 使用 text/plain 可避免預檢請求 (CORS preflight) 被擋
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(bodyData),
      mode: 'cors'
    });

    if (!res.ok) {
      throw new Error('伺服器錯誤: ' + res.status);
    }
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error || '操作失敗');
    }
    return result;
  }

  window.ScaleApi = {
    getBaseUrl: getApiBaseUrl,
    setBaseUrl: setApiBaseUrl,
    getAdminKey: getAdminKey,
    setAdminKey: setAdminKey,
    fetchDispatches: fetchDispatches,
    postAction: postAction
  };
})();
