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
   * 解析 #RRGGBB 为 RGB
   */
  function parseHex(hex) {
    var h = (hex || "#b02022").replace("#", "");
    if (h.length !== 6) h = "b02022";
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  /**
   * RGB 转十六进制
   */
  function toHex(r, g, b) {
    function pad(n) {
      var s = Math.max(0, Math.min(255, Math.round(n))).toString(16);
      return s.length === 1 ? "0" + s : s;
    }
    return "#" + pad(r) + pad(g) + pad(b);
  }

  /**
   * 按加深滑块贴近实物印泥红（取样约 #b02022），避免发粉或发褐
   */
  function deepenColor(hex, depth) {
    var d = Math.min(100, Math.max(0, depth != null ? Number(depth) : 0)) / 100;
    var rgb = parseHex(hex);

    // 实物印泥锚点：实色区 #b02022，更深区约 #8b1518
    var midR = 176;
    var midG = 32;
    var midB = 34;
    var deepR = 139;
    var deepG = 21;
    var deepB = 24;

    var targetR;
    var targetG;
    var targetB;
    if (d <= 0.45) {
      var t = d / 0.45;
      targetR = rgb.r + (midR - rgb.r) * t;
      targetG = rgb.g + (midG - rgb.g) * t;
      targetB = rgb.b + (midB - rgb.b) * t;
    } else {
      var u = (d - 0.45) / 0.55;
      targetR = midR + (deepR - midR) * u;
      targetG = midG + (deepG - midG) * u;
      targetB = midB + (deepB - midB) * u;
    }

    // 轻度提纯：压绿蓝，保持朱砂红感
    targetG *= 0.92;
    targetB *= 0.9;
    return toHex(targetR, targetG, targetB);
  }

  /**
   * 将加粗滑块(0-100)映射为 CSS font-weight
   */
  function fontWeight(cfg) {
    var bold = cfg.fontBold != null ? Number(cfg.fontBold) : 48;
    bold = Math.min(100, Math.max(0, bold));
    // 0→400，50→700，100→900
    var w = 400 + Math.round((bold / 100) * 500);
    if (w > 800) w = 900;
    else if (w > 650) w = 700;
    else if (w > 500) w = 600;
    else if (w > 350) w = 500;
    else w = 400;
    return String(w);
  }

  /**
   * 额外描边加粗宽度（系统字体字重不够时补充笔画厚度）
   */
  function boldStrokeWidth(cfg, fontSize) {
    var bold = cfg.fontBold != null ? Number(cfg.fontBold) : 48;
    bold = Math.min(100, Math.max(0, bold));
    if (bold <= 30) return 0;
    // 30 以上开始描边加粗，最高约字号的 12%
    return ((bold - 30) / 70) * fontSize * 0.12;
  }

  /**
   * 获取字体族
   */
  function fontFamily(cfg) {
    return FONT_MAP[cfg.font] || FONT_MAP.sourceHan;
  }

  /**
   * 按当前加粗设置绘制文字（填充 + 可选描边）
   */
  function paintGlyph(ctx, text, x, y, color, strokeW) {
    if (strokeW > 0) {
      ctx.lineWidth = strokeW;
      ctx.strokeStyle = color;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeText(text, x, y);
    }
    ctx.fillText(text, x, y);
  }

  /**
   * 沿圆弧绘制文字，支持字宽字高缩放
   */
  function drawArcText(ctx, text, cx, cy, radius, centerDeg, spanDeg, fontSize, color, scaleX, scaleY, font, weight, strokeW) {
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
      ctx.font = (weight || "700") + " " + fontSize + "px " + font;
      paintGlyph(ctx, chars[i], 0, 0, color, strokeW || 0);
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * 绘制横排文字
   */
  function drawFlatText(ctx, text, cx, y, fontSize, color, scaleX, scaleY, font, weight, strokeW) {
    if (!text) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(cx, y);
    ctx.scale(scaleX || 1, scaleY || 1);
    ctx.font = (weight || "700") + " " + fontSize + "px " + font;
    paintGlyph(ctx, text, 0, 0, color, strokeW || 0);
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
   * 根据 0-100 滑块值计算做旧参数（高值区间非线性增强）
   * 以成片硬挖空模拟缺墨，避免半透明把红色冲浅
   */
  function getAgingParams(level) {
    if (!level || level <= 0) return null;
    var t = Math.min(100, Math.max(0, level)) / 100;
    var t2 = t * t;
    return {
      // 大块缺墨生成概率（按实体像素抽样）
      blobChance: t * 0.0035 + t2 * 0.0045,
      blobMinR: 3 + Math.floor(t * 3),
      blobMaxR: 7 + Math.floor(t * 10),
      // 中等砂点
      gritChance: t * 0.01 + t2 * 0.012,
      gritMinR: 1,
      gritMaxR: 2 + Math.floor(t * 3),
      // 局部印泥略加深
      darken: t * 0.08 + t2 * 0.06,
      darkenMin: 0.72,
      darkenMax: 0.92,
      passes: t >= 0.4 ? 2 : 1,
    };
  }

  /**
   * 在像素数据上挖一个不规则圆孔
   */
  function punchHole(data, w, h, cx, cy, radius, rand) {
    var rMax = Math.ceil(radius);
    var r2 = radius * radius;
    for (var dy = -rMax; dy <= rMax; dy++) {
      for (var dx = -rMax; dx <= rMax; dx++) {
        var dist2 = dx * dx + dy * dy;
        if (dist2 > r2) continue;
        // 边缘随机咬蚀，形成不规则缺墨轮廓
        if (dist2 > r2 * 0.55 && rand() > 0.55) continue;
        var x = cx + dx;
        var y = cy + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        data[(y * w + x) * 4 + 3] = 0;
      }
    }
  }

  /**
   * 做旧老化：成片透明挖空表现磨损，保留像素保持不透明原色
   */
  function applyAging(canvas, level) {
    var p = getAgingParams(level);
    if (!p) return;

    var ctx = canvas.getContext("2d");
    var w = canvas.width;
    var h = canvas.height;
    // 按画布分辨率放大孔径，避免高清下看起来太碎
    var scale = Math.max(1, w / 400);

    for (var pass = 0; pass < p.passes; pass++) {
      var imgData = ctx.getImageData(0, 0, w, h);
      var data = imgData.data;
      var seed = 42 + pass * 9973;
      var intensity = pass === 0 ? 1 : 0.55;

      function rand() {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      }

      var blobs = [];
      var grit = [];

      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var i = (y * w + x) * 4;
          if (data[i + 3] === 0) continue;

          if (rand() < p.blobChance * intensity) {
            var br =
              (p.blobMinR + rand() * (p.blobMaxR - p.blobMinR + 1)) * scale;
            blobs.push({ x: x, y: y, r: br });
            continue;
          }

          if (rand() < p.gritChance * intensity) {
            var gr =
              (p.gritMinR + rand() * (p.gritMaxR - p.gritMinR + 1)) * scale;
            grit.push({ x: x, y: y, r: gr });
            continue;
          }

          if (rand() < p.darken * intensity) {
            var ink = p.darkenMin + rand() * (p.darkenMax - p.darkenMin);
            data[i] = Math.max(0, Math.floor(data[i] * ink));
            data[i + 1] = Math.max(0, Math.floor(data[i + 1] * ink * 0.85));
            data[i + 2] = Math.max(0, Math.floor(data[i + 2] * ink * 0.85));
            data[i + 3] = 255;
          }
        }
      }

      var k;
      for (k = 0; k < grit.length; k++) {
        punchHole(data, w, h, grit[k].x, grit[k].y, grit[k].r, rand);
      }
      for (k = 0; k < blobs.length; k++) {
        punchHole(data, w, h, blobs[k].x, blobs[k].y, blobs[k].r, rand);
      }

      ctx.putImageData(imgData, 0, 0);
    }
  }

  /**
   * 根据格式生成上弧标题文字
   */
  function getArcTitle(cfg) {
    var t = (cfg.title || "").trim();
    if (cfg.sealFormat === "village") {
      var suffix = "村民委员会";
      if (t && t.slice(-suffix.length) !== suffix) {
        return t + suffix;
      }
      return t || suffix;
    }
    return t;
  }

  /**
   * 根据标题位置与字数自动计算编码下弧参数
   */
  function getSerialLayout(cfg) {
    var titlePos = cfg.titlePos || 150;
    var titleAngle = cfg.titleAngle || 220;
    var offset = cfg.serialOffset != null ? cfg.serialOffset : 10;
    var arcTitle = getArcTitle(cfg);
    var titleLen = Math.max(arcTitle.length, 1);
    var serialLen = Math.max((cfg.serial || "").trim().length, 1);

    // 下弧半径跟随标题位置，通过偏移量控制内外间距
    var serialPos = Math.max(75, Math.min(175, titlePos + offset));

    // 按编码字数紧缩弧度，并以标题角度为上限，避免左右与上弧重叠
    var byChars = serialLen * 10 + 35;
    var byTitle = titleAngle * (serialLen / titleLen) * 0.82;
    var maxAngle = cfg.serialAngle || 90;
    var serialAngle = Math.min(maxAngle, byChars, byTitle, titleAngle * 0.82);
    serialAngle = Math.max(60, serialAngle);

    return { serialPos: serialPos, serialAngle: serialAngle };
  }

  /**
   * 绘制圆形公章
   */
  function drawCircleSeal(ctx, size, cfg) {
    var s = scaleOf(cfg);
    var cx = size / 2;
    var cy = size / 2;
    var color = deepenColor(cfg.color || "#b02022", cfg.colorDepth);
    var font = fontFamily(cfg);
    var weight = fontWeight(cfg);
    var borderW = (cfg.borderSize || 12) * s;
    var outerR = size / 2 - borderW * 1.2;
    var arcTitle = getArcTitle(cfg);
    var titlePos = (cfg.titlePos || 150) * s;
    var titleAngle = cfg.titleAngle || 220;
    var serialLayout = getSerialLayout(cfg);
    var titleFontSize = (cfg.titleSize || 50) * s;
    var serialFontSize = (cfg.serialSize || 18) * s;
    var subtitleFontSize = (cfg.subtitleSize || 40) * s;

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
      arcTitle,
      cx, cy,
      titlePos,
      -90,
      titleAngle,
      titleFontSize,
      color,
      cfg.titleScaleX,
      cfg.titleScaleY,
      font,
      weight,
      boldStrokeWidth(cfg, titleFontSize)
    );

    // 编码（下弧，仅格式二）
    if (cfg.sealFormat === "village") {
      drawArcText(
        ctx,
        cfg.serial,
        cx, cy,
        serialLayout.serialPos * s,
        90,
        serialLayout.serialAngle,
        serialFontSize,
        color,
        cfg.serialScaleX,
        cfg.serialScaleY,
        font,
        weight,
        boldStrokeWidth(cfg, serialFontSize)
      );
    }

    // 五角星
    var starR = ((cfg.starSize || 100) * s) / 2;
    var starY = cy + (cfg.starPos || 0) * s;
    drawStar(ctx, cx, starY, starR, color);

    // 副标题（仅格式一）
    if (cfg.sealFormat !== "village") {
      drawFlatText(
        ctx,
        cfg.subtitle,
        cx,
        cy + (cfg.subtitlePos || 78) * s,
        subtitleFontSize,
        color,
        cfg.subtitleScaleX,
        cfg.subtitleScaleY,
        font,
        weight,
        boldStrokeWidth(cfg, subtitleFontSize)
      );
    }
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
