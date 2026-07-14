/**
 * 圆形公章默认配置（村委会标准章）
 */
(function (global) {
  "use strict";

  var DEFAULT_CONFIG = {
    type: "circle",
    size: 400,
    color: "#e60012",
    colorDepth: 55,
    font: "sourceHan",
    fontBold: 48,
    agingLevel: 42,

    sealFormat: "standard",

    // 基础设置
    title: "",
    subtitle: "村民委员会",
    serial: "1306268804527",

    // 高级设置（默认参数）
    titleSize: 50,
    titlePos: 150,
    titleAngle: 220,
    subtitleSize: 40,
    subtitlePos: 78,
    serialSize: 18,
    serialOffset: 10,
    serialAngle: 90,
    starSize: 100,
    starPos: 0,
    borderSize: 12,

    // 其他设置（字宽/字高比例）
    titleScaleX: 0.8,
    titleScaleY: 1,
    subtitleScaleX: 0.8,
    subtitleScaleY: 1,
    serialScaleX: 1,
    serialScaleY: 1,
  };

  var COLOR_PRESETS = [
    "#e60012",
    "#c41e3a",
    "#b71c1c",
    "#f57c00",
    "#ffab40",
    "#1565c0",
  ];

  global.SealDefaults = {
    config: DEFAULT_CONFIG,
    colors: COLOR_PRESETS,
  };
})(window);
