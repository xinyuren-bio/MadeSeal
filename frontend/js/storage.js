/**
 * 本地存储：最近下载记录
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "seal_recent_downloads";
  var MAX_ITEMS = 12;

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function save(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
    } catch (e) {
      console.warn("保存最近下载记录失败", e);
    }
  }

  /**
   * 添加一条下载记录
   */
  function addRecord(cfg, dataUrl) {
    var items = load();
    var record = {
      id: Date.now().toString(36),
      templateId: cfg.templateId || "",
      name: cfg.subtitle || cfg.title || "印章",
      dataUrl: dataUrl,
      time: new Date().toISOString(),
    };
    items.unshift(record);
    save(items);
    return record;
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  global.SealStorage = {
    load: load,
    add: addRecord,
    clear: clear,
    MAX: MAX_ITEMS,
  };
})(window);
