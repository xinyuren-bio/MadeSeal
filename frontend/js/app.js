(function () {
  "use strict";

  var cfg = Object.assign({}, window.SealDefaults.config);
  var previewCanvas = document.getElementById("preview-canvas");
  var colorHex = document.getElementById("color-hex");
  var colorSwatches = document.getElementById("color-swatches");
  var btnDownload = document.getElementById("btn-download");

  // 所有可绑定字段 ID 列表
  var FIELD_IDS = [
    "sealFormat", "title", "subtitle", "serial", "font", "agingLevel",
    "titleSize", "titlePos", "titleAngle",
    "subtitleSize", "subtitlePos",
    "serialSize", "serialPos", "serialAngle",
    "starSize", "starPos", "borderSize",
    "titleScaleX", "titleScaleY",
    "subtitleScaleX", "subtitleScaleY",
    "serialScaleX", "serialScaleY",
    "output-size",
  ];

  /**
   * 根据印章格式切换界面显示
   */
  function updateFormatUI() {
    var fmt = cfg.sealFormat || "standard";
    var isVillage = fmt === "village";
    var subtitleGroup = document.getElementById("subtitle-group");
    var subtitleAdvanced = document.getElementById("subtitle-advanced-group");
    var subtitleOther = document.getElementById("subtitle-other-group");
    var titleLabel = document.getElementById("title-label");
    var titleInput = document.getElementById("title");

    if (subtitleGroup) subtitleGroup.classList.toggle("hidden", isVillage);
    if (subtitleAdvanced) subtitleAdvanced.classList.toggle("hidden", isVillage);
    if (subtitleOther) subtitleOther.classList.toggle("hidden", isVillage);

    if (titleLabel) {
      titleLabel.textContent = isVillage ? "标题（自动追加村民委员会）" : "标题";
    }
    if (titleInput) {
      titleInput.placeholder = isVillage
        ? "如：定兴县北辛村"
        : "请输入上弧标题";
    }
  }

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
    var agingLabel = document.getElementById("agingLevel-label");
    var agingHint = document.getElementById("agingLevel-hint");
    if (agingLabel) agingLabel.textContent = cfg.agingLevel;
    if (agingHint) agingHint.textContent = agingHintText(cfg.agingLevel || 0);
    updateFormatUI();
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
   * 做旧程度文字提示
   */
  function agingHintText(v) {
    if (v <= 0) return "无做旧";
    if (v <= 25) return "轻度做旧";
    if (v <= 50) return "中度做旧";
    if (v <= 75) return "较重做旧";
    return "重度做旧";
  }

  /**
   * 是否为手机端
   */
  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  /**
   * 是否为微信内置浏览器
   */
  function isWeChat() {
    return /MicroMessenger/i.test(navigator.userAgent);
  }

  /**
   * 显示手机端保存弹窗
   */
  function showSaveModal(dataUrl) {
    var modal = document.getElementById("save-modal");
    var img = document.getElementById("save-modal-img");
    var tip = document.getElementById("save-modal-tip");
    if (!modal || !img) return;

    img.src = dataUrl;
    if (tip) {
      tip.textContent = isWeChat()
        ? "微信内无法直接下载，请长按下方图片保存，或点右上角 ··· → 在浏览器中打开"
        : "请长按下方图片，选择「保存图片」或「添加到相册」";
    }
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  /**
   * 关闭保存弹窗
   */
  function hideSaveModal() {
    var modal = document.getElementById("save-modal");
    if (modal) modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  /**
   * 初始化保存弹窗
   */
  function initSaveModal() {
    var backdrop = document.getElementById("save-modal-backdrop");
    var closeBtn = document.getElementById("save-modal-close");
    if (backdrop) backdrop.addEventListener("click", hideSaveModal);
    if (closeBtn) closeBtn.addEventListener("click", hideSaveModal);
  }

  /**
   * 桌面端触发文件下载
   */
  function downloadFile(dataUrl, filename) {
    var link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * 处理下载/保存
   */
  function handleDownload() {
    readForm();
    var name = cfg.subtitle || cfg.title || "印章";
    var filename = name + ".png";
    var dataUrl = window.SealRenderer.toDataURL(cfg);

    if (isMobile() || isWeChat()) {
      showSaveModal(dataUrl);
    } else {
      downloadFile(dataUrl, filename);
    }

    if (window.SealStorage) {
      window.SealStorage.add(cfg, dataUrl);
    }
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
        if (id === "agingLevel") {
          var agingLabel = document.getElementById("agingLevel-label");
          var agingHint = document.getElementById("agingLevel-hint");
          if (agingLabel) agingLabel.textContent = el.value;
          if (agingHint) agingHint.textContent = agingHintText(parseInt(el.value, 10));
        }
        if (id === "sealFormat") {
          cfg.sealFormat = el.value;
          updateFormatUI();
        }
        updatePreview();
      });
    });

    if (btnDownload) {
      btnDownload.addEventListener("click", handleDownload);
    }
  }

  initColors();
  initTabs();
  initSaveModal();
  fillForm();
  bindEvents();

  // 等待思源宋体加载后再渲染，避免字体闪烁
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updatePreview);
  } else {
    updatePreview();
  }
})();
