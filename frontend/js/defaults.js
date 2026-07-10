/**
 * 圆形公章默认配置（村委会标准章）
 */
(function (global) {
  "use strict";

  var DEFAULT_CONFIG = {
    type: "circle",
    size: 400,
    color: "#bb1918",
    font: "sourceHan",
    aging: "medium",

    // 基础设置
    title: "太原县腰站镇沙庄村",
    subtitle: "村民委员会",

    // 高级设置（默认参数）
    titleSize: 50,
    titlePos: 150,
    titleAngle: 220,
    subtitleSize: 40,
    subtitlePos: 78,
    starSize: 100,
    starPos: 0,
    borderSize: 8,

    // 其他设置（字宽/字高比例）
    titleScaleX: 0.8,
    titleScaleY: 1,
    subtitleScaleX: 0.8,
    subtitleScaleY: 1,
  };

  var COLOR_PRESETS = [
    "#bb1918",
    "#e53935",
    "#f57c00",
    "#ffab40",
    "#1e88e5",
    "#1565c0",
  ];

  global.SealDefaults = {
    config: DEFAULT_CONFIG,
    colors: COLOR_PRESETS,
  };
})(window);
