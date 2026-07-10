/**
 * 圆形公章 Canvas 渲染引擎
 */
(function (global) {
  "use strict";

  var FONT_MAP = {
    sourceHan: '"Noto Serif SC", "Source Han Serif SC", "思源宋体", serif',
    system: '"STSong", "SimSun", "Songti SC", serif',
    heiti: '"SimHei", "Heiti SC", "Microsoft YaHei", sans-serif',
    kaiti: '"KaiTi", "STKaiti", "Kaiti SC", serif',
  };

  var FONT_WEIGHT_MAP = {
    sourceHan: "600",
    system: "bold",
    heiti: "bold",
    kaiti: "bold",
  };

  var BASE_SIZE = 400;

  /**
   * 创建高分辨率画布
   */
  function createCanvas(size) {
    var canvas = document.createElement("canvas");
    var dpr = Math.max(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return { canvas: canvas, ctx: ctx, size: size };
  }

  /**
   * 获取缩放比例
   */
  function scaleOf(cfg) {
    return (cfg.size || BASE_SIZE) / BASE_SIZE;
  }

  /**
   * 获取字体粗细
   */
  function fontWeight(cfg) {
    return FONT_WEIGHT_MAP[cfg.font] || "bold";
  }

  /**
   * 获取字体族
   */
  function fontFamily(cfg) {
    return FONT_MAP[cfg.font] || FONT_MAP.sourceHan;
  }

  /**
   * 沿圆弧绘制文字，支持字宽字高缩放
   */
  function drawArcText(ctx, text, cx, cy, radius, centerDeg, spanDeg, fontSize, color, scaleX, scaleY, font, weight) {
    if (!text) return;
    var chars = text.split("");
    var n = chars.length;
    if (n === 0) return;

    var startRad = ((centerDeg - spanDeg / 2) * Math.PI) / 180;
    var endRad = ((centerDeg + spanDeg / 2) * Math.PI) / 180;
    var step = n > 1 ? (endRad - startRad) / (n - 1) : 0;

    ctx.save();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (var i = 0; i < n; i++) {
      var angle = n > 1 ? startRad + step * i : (centerDeg * Math.PI) / 180;
      var x = cx + radius * Math.cos(angle);
      var y = cy + radius * Math.sin(angle);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.scale(scaleX || 1, scaleY || 1);
      ctx.font = (weight || "bold") + " " + fontSize + "px " + font;
      ctx.fillText(chars[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * 绘制横排文字
   */
  function drawFlatText(ctx, text, cx, y, fontSize, color, scaleX, scaleY, font, weight) {
    if (!text) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(cx, y);
    ctx.scale(scaleX || 1, scaleY || 1);
    ctx.font = (weight || "bold") + " " + fontSize + "px " + font;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  /**
   * 绘制五角星
   */
  function drawStar(ctx, cx, cy, outerR, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < 5; i++) {
      var outerAngle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      var innerAngle = outerAngle + Math.PI / 5;
      var ox = cx + outerR * Math.cos(outerAngle);
      var oy = cy + outerR * Math.sin(outerAngle);
      var ix = cx + outerR * 0.382 * Math.cos(innerAngle);
      var iy = cy + outerR * 0.382 * Math.sin(innerAngle);
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * 根据 0-100 滑块值计算做旧参数
   */
  function getAgingParams(level) {
    if (!level || level <= 0) return null;
    var t = Math.min(100, Math.max(0, level)) / 100;
    return {
      hole: t * 0.28,
      fade: t * 0.16,
      speckle: t * 0.06,
      fadeMin: 1.0 - t * 0.45,
      fadeMax: 1.0 - t * 0.15,
      speckleBlend: t * 0.2,
    };
  }

  /**
   * 做旧老化效果（在完整画布像素上操作）
   */
  function applyAging(canvas, level) {
    var p = getAgingParams(level);
    if (!p) return;

    var ctx = canvas.getContext("2d");
    var w = canvas.width;
    var h = canvas.height;
    var imgData = ctx.getImageData(0, 0, w, h);
    var data = imgData.data;
    var seed = 42;

    function rand() {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    }

    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      var r = rand();

      // 随机透明缺口（缺墨）
      if (r < p.hole) {
        data[i + 3] = 0;
        continue;
      }

      // 半透明淡化（保留更多红色，避免颜色过浅）
      if (r < p.hole + p.fade) {
        var fade = p.fadeMin + rand() * (p.fadeMax - p.fadeMin);
        data[i + 3] = Math.floor(data[i + 3] * fade);
        continue;
      }

      // 轻微白色噪点（降低混合比例，避免泛红变白）
      if (r < p.hole + p.fade + p.speckle) {
        var blend = p.speckleBlend * rand();
        data[i] = Math.floor(data[i] * (1 - blend) + 255 * blend);
        data[i + 1] = Math.floor(data[i + 1] * (1 - blend) + 240 * blend);
        data[i + 2] = Math.floor(data[i + 2] * (1 - blend) + 240 * blend);
        data[i + 3] = Math.floor(data[i + 3] * (0.75 + rand() * 0.25));
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * 绘制圆形公章
   */
  function drawCircleSeal(ctx, size, cfg) {
    var s = scaleOf(cfg);
    var cx = size / 2;
    var cy = size / 2;
    var color = cfg.color || "#bb1918";
    var font = fontFamily(cfg);
    var weight = fontWeight(cfg);
    var borderW = (cfg.borderSize || 8) * s;
    var outerR = size / 2 - borderW * 1.2;

    ctx.clearRect(0, 0, size, size);

    // 外边框
    ctx.strokeStyle = color;
    ctx.lineWidth = borderW;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.stroke();

    // 标题（上弧）
    drawArcText(
      ctx,
      cfg.title,
      cx, cy,
      (cfg.titlePos || 150) * s,
      -90,
      cfg.titleAngle || 220,
      (cfg.titleSize || 50) * s,
      color,
      cfg.titleScaleX,
      cfg.titleScaleY,
      font,
      weight
    );

    // 五角星
    var starR = ((cfg.starSize || 100) * s) / 2;
    var starY = cy + (cfg.starPos || 0) * s;
    drawStar(ctx, cx, starY, starR, color);

    // 副标题
    drawFlatText(
      ctx,
      cfg.subtitle,
      cx,
      cy + (cfg.subtitlePos || 78) * s,
      (cfg.subtitleSize || 40) * s,
      color,
      cfg.subtitleScaleX,
      cfg.subtitleScaleY,
      font,
      weight
    );
  }

  /**
   * 渲染印章
   */
  function render(cfg) {
    var size = cfg.size || BASE_SIZE;
    var c = createCanvas(size);
    drawCircleSeal(c.ctx, size, cfg);
    applyAging(c.canvas, cfg.agingLevel);
    return c.canvas;
  }

  /**
   * 导出 PNG
   */
  function toDataURL(cfg) {
    return render(cfg).toDataURL("image/png");
  }

  /**
   * 触发下载
   */
  function download(cfg, filename) {
    var dataUrl = toDataURL(cfg);
    var link = document.createElement("a");
    link.download = filename || "印章.png";
    link.href = dataUrl;
    link.click();
    return dataUrl;
  }

  global.SealRenderer = {
    render: render,
    toDataURL: toDataURL,
    download: download,
    BASE_SIZE: BASE_SIZE,
  };
})(window);
