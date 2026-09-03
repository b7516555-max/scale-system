// api-config.js: 自動識別 API 伺服器網址
// 支援本機環境 (同源 /api)、自訂雲端後端網址 (例如 Render/Railway/Fly.io)，或透過 URL 參數 (?api=...)
(function() {
  function getApiBaseUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramApi = urlParams.get('api');
    if (paramApi) {
      localStorage.setItem('scale_api_url', paramApi.replace(/\/+$/, ''));
      return paramApi.replace(/\/+$/, '');
    }
    const saved = localStorage.getItem('scale_api_url');
    if (saved) return saved;

    // 若為 localhost 或 127.0.0.1 或區域網路 IP，預設走同源
    return '';
  }

  function setApiBaseUrl(url) {
    if (!url) {
      localStorage.removeItem('scale_api_url');
    } else {
      localStorage.setItem('scale_api_url', url.replace(/\/+$/, ''));
    }
  }

  window.ScaleApi = {
    getBaseUrl: getApiBaseUrl,
    setBaseUrl: setApiBaseUrl,
    getUrl: function(path) {
      const base = getApiBaseUrl();
      return base ? ${base} : path;
    }
  };
})();
