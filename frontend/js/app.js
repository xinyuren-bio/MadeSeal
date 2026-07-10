(function () {
  "use strict";

  var cfg = Object.assign({}, window.SealDefaults.config);
  var previewCanvas = document.getElementById("preview-canvas");
  var colorHex = document.getElementById("color-hex");
  var colorSwatches = document.getElementById("color-swatches");
  var btnDownload = document.getElementById("btn-download");

  // 所有可绑定字段 ID 列表
  var FIELD_IDS = [
    "title", "subtitle", "font", "aging",
    "titleSize", "titlePos", "titleAngle",
    "subtitleSize", "subtitlePos",
    "starSize", "starPos", "borderSize",
    "titleScaleX", "titleScaleY",
    "subtitleScaleX", "subtitleScaleY",
    "output-size",
  ];

  /**
   * 初始化颜色选择器
   */
  function initColors() {
    window.SealDefaults.colors.forEach(function (c) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-swatch" + (c === cfg.color ? " active" : "");
      btn.style.background = c;
      btn.dataset.color = c;
      btn.addEventListener("click", function () {
        setColor(c);
      });
      colorSwatches.appendChild(btn);
    });

    colorHex.addEventListener("change", function () {
      var v = colorHex.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        setColor(v);
      }
    });
  }

  /**
   * 设置颜色并更新 UI
   */
  function setColor(c) {
    cfg.color = c;
    colorHex.value = c;
    document.querySelectorAll(".color-swatch").forEach(function (sw) {
      sw.classList.toggle("active", sw.dataset.color === c);
    });
    updatePreview();
  }

  /**
   * 将配置填入表单
   */
  function fillForm() {
    FIELD_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var key = id === "output-size" ? "size" : id;
      var val = cfg[key];
      if (el.type === "range") {
        el.value = val;
        var valEl = document.getElementById(id + "-val");
        if (valEl) valEl.textContent = val;
      } else {
        el.value = val;
      }
    });
    if (colorHex) colorHex.value = cfg.color;
    var sizeLabel = document.getElementById("size-label");
    if (sizeLabel) sizeLabel.textContent = cfg.size + "px";
  }

  /**
   * 从表单读取配置
   */
  function readForm() {
    FIELD_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var key = id === "output-size" ? "size" : id;
      if (el.type === "range") {
        cfg[key] = parseFloat(el.value);
      } else {
        cfg[key] = el.value;
      }
    });
    return cfg;
  }

  /**
   * 更新预览
   */
  function updatePreview() {
    readForm();
    var rendered = window.SealRenderer.render(cfg);
    previewCanvas.width = rendered.width;
    previewCanvas.height = rendered.height;
    var displaySize = Math.min(cfg.size, 280);
    previewCanvas.style.width = displaySize + "px";
    previewCanvas.style.height = displaySize + "px";
    var ctx = previewCanvas.getContext("2d");
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    ctx.drawImage(rendered, 0, 0);
  }

  /**
   * 标签页切换
   */
  function initTabs() {
    var tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tab = btn.dataset.tab;
        tabBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        document.querySelectorAll(".tab-panel").forEach(function (p) {
          p.classList.toggle("active", p.id === "tab-" + tab);
        });
      });
    });
  }

  /**
   * 绑定所有输入事件
   */
  function bindEvents() {
    FIELD_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", function () {
        var valEl = document.getElementById(id + "-val");
        if (valEl) valEl.textContent = el.value;
        if (id === "output-size") {
          var sizeLabel = document.getElementById("size-label");
          if (sizeLabel) sizeLabel.textContent = el.value + "px";
        }
        updatePreview();
      });
    });

    if (btnDownload) {
      btnDownload.addEventListener("click", function () {
        readForm();
        var name = cfg.subtitle || cfg.title || "印章";
        var dataUrl = window.SealRenderer.download(cfg, name + ".png");
        if (window.SealStorage) {
          window.SealStorage.add(cfg, dataUrl);
        }
      });
    }
  }

  initColors();
  initTabs();
  fillForm();
  bindEvents();

  // 等待思源宋体加载后再渲染，避免字体闪烁
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updatePreview);
  } else {
    updatePreview();
  }
})();
