/* =========================================================
   Upon Star — 城市经纬度库（中国为主 + 主要国际城市）
   用途：占星 / 本命星盘 / 融合比对 出生地选择，自动填充经纬度与时区。
   坐标精度约 ±0.05°，仅供文化探索参考。
   ========================================================= */
(function () {
  'use strict';

  // region 顺序决定下拉分组顺序
  var CITIES = [
    // 华北
    { name: '北京', lat: 39.9042, lng: 116.4074, tz: 8, region: '华北' },
    { name: '天津', lat: 39.3434, lng: 117.3616, tz: 8, region: '华北' },
    { name: '石家庄', lat: 38.0428, lng: 114.5149, tz: 8, region: '华北' },
    { name: '太原', lat: 37.8706, lng: 112.5489, tz: 8, region: '华北' },
    { name: '呼和浩特', lat: 40.8424, lng: 111.7492, tz: 8, region: '华北' },
    { name: '唐山', lat: 39.63, lng: 118.18, tz: 8, region: '华北' },
    { name: '秦皇岛', lat: 39.94, lng: 119.60, tz: 8, region: '华北' },
    { name: '张家口', lat: 40.82, lng: 114.88, tz: 8, region: '华北' },
    { name: '大同', lat: 40.08, lng: 113.30, tz: 8, region: '华北' },
    { name: '临汾', lat: 36.09, lng: 111.52, tz: 8, region: '华北' },
    // 东北
    { name: '沈阳', lat: 41.8057, lng: 123.4315, tz: 8, region: '东北' },
    { name: '长春', lat: 43.8171, lng: 125.3235, tz: 8, region: '东北' },
    { name: '哈尔滨', lat: 45.8038, lng: 126.5349, tz: 8, region: '东北' },
    { name: '大连', lat: 38.9140, lng: 121.6147, tz: 8, region: '东北' },
    { name: '吉林', lat: 43.84, lng: 126.55, tz: 8, region: '东北' },
    { name: '鞍山', lat: 41.11, lng: 123.00, tz: 8, region: '东北' },
    { name: '大庆', lat: 46.59, lng: 125.03, tz: 8, region: '东北' },
    { name: '佳木斯', lat: 46.81, lng: 130.38, tz: 8, region: '东北' },
    { name: '齐齐哈尔', lat: 47.35, lng: 123.92, tz: 8, region: '东北' },
    // 华东
    { name: '上海', lat: 31.2304, lng: 121.4737, tz: 8, region: '华东' },
    { name: '南京', lat: 32.0603, lng: 118.7969, tz: 8, region: '华东' },
    { name: '杭州', lat: 30.2741, lng: 120.1551, tz: 8, region: '华东' },
    { name: '苏州', lat: 31.2989, lng: 120.5853, tz: 8, region: '华东' },
    { name: '无锡', lat: 31.4912, lng: 120.3119, tz: 8, region: '华东' },
    { name: '宁波', lat: 29.8683, lng: 121.5440, tz: 8, region: '华东' },
    { name: '温州', lat: 27.9938, lng: 120.6994, tz: 8, region: '华东' },
    { name: '合肥', lat: 31.8206, lng: 117.2272, tz: 8, region: '华东' },
    { name: '济南', lat: 36.6512, lng: 117.1201, tz: 8, region: '华东' },
    { name: '青岛', lat: 36.0671, lng: 120.3826, tz: 8, region: '华东' },
    { name: '烟台', lat: 37.4617, lng: 121.4400, tz: 8, region: '华东' },
    { name: '福州', lat: 26.0745, lng: 119.2965, tz: 8, region: '华东' },
    { name: '厦门', lat: 24.4798, lng: 118.0894, tz: 8, region: '华东' },
    { name: '南昌', lat: 28.6821, lng: 115.8579, tz: 8, region: '华东' },
    { name: '徐州', lat: 34.27, lng: 117.18, tz: 8, region: '华东' },
    { name: '常州', lat: 31.81, lng: 119.97, tz: 8, region: '华东' },
    { name: '南通', lat: 31.98, lng: 120.89, tz: 8, region: '华东' },
    { name: '泉州', lat: 24.87, lng: 118.68, tz: 8, region: '华东' },
    { name: '赣州', lat: 25.83, lng: 114.93, tz: 8, region: '华东' },
    { name: '潍坊', lat: 36.71, lng: 119.16, tz: 8, region: '华东' },
    { name: '临沂', lat: 35.10, lng: 118.35, tz: 8, region: '华东' },
    { name: '蚌埠', lat: 32.92, lng: 117.39, tz: 8, region: '华东' },
    { name: '九江', lat: 29.71, lng: 116.00, tz: 8, region: '华东' },
    { name: '黄山', lat: 29.71, lng: 118.34, tz: 8, region: '华东' },
    // 华中
    { name: '郑州', lat: 34.7466, lng: 113.6254, tz: 8, region: '华中' },
    { name: '武汉', lat: 30.5928, lng: 114.3055, tz: 8, region: '华中' },
    { name: '长沙', lat: 28.2282, lng: 112.9388, tz: 8, region: '华中' },
    { name: '洛阳', lat: 34.62, lng: 112.45, tz: 8, region: '华中' },
    { name: '株洲', lat: 27.83, lng: 113.13, tz: 8, region: '华中' },
    { name: '襄阳', lat: 32.01, lng: 112.12, tz: 8, region: '华中' },
    // 华南
    { name: '广州', lat: 23.1291, lng: 113.2644, tz: 8, region: '华南' },
    { name: '深圳', lat: 22.5431, lng: 114.0579, tz: 8, region: '华南' },
    { name: '珠海', lat: 22.2710, lng: 113.5767, tz: 8, region: '华南' },
    { name: '东莞', lat: 23.0210, lng: 113.7518, tz: 8, region: '华南' },
    { name: '佛山', lat: 23.0218, lng: 113.1219, tz: 8, region: '华南' },
    { name: '南宁', lat: 22.8170, lng: 108.3665, tz: 8, region: '华南' },
    { name: '海口', lat: 20.0440, lng: 110.1999, tz: 8, region: '华南' },
    { name: '三亚', lat: 18.2528, lng: 109.5119, tz: 8, region: '华南' },
    { name: '桂林', lat: 25.2736, lng: 110.2990, tz: 8, region: '华南' },
    { name: '湛江', lat: 21.27, lng: 110.36, tz: 8, region: '华南' },
    { name: '汕头', lat: 23.35, lng: 116.68, tz: 8, region: '华南' },
    { name: '柳州', lat: 24.33, lng: 109.42, tz: 8, region: '华南' },
    { name: '北海', lat: 21.48, lng: 109.10, tz: 8, region: '华南' },
    // 西南
    { name: '重庆', lat: 29.5630, lng: 106.5516, tz: 8, region: '西南' },
    { name: '成都', lat: 30.5728, lng: 104.0668, tz: 8, region: '西南' },
    { name: '贵阳', lat: 26.6470, lng: 106.6302, tz: 8, region: '西南' },
    { name: '昆明', lat: 25.0389, lng: 102.7183, tz: 8, region: '西南' },
    { name: '拉萨', lat: 29.6520, lng: 91.1721, tz: 8, region: '西南' },
    { name: '丽江', lat: 26.8721, lng: 100.2299, tz: 8, region: '西南' },
    { name: '大理', lat: 25.6065, lng: 100.2676, tz: 8, region: '西南' },
    { name: '绵阳', lat: 31.47, lng: 104.68, tz: 8, region: '西南' },
    { name: '遵义', lat: 27.73, lng: 106.93, tz: 8, region: '西南' },
    { name: '宜宾', lat: 28.75, lng: 104.64, tz: 8, region: '西南' },
    { name: '曲靖', lat: 25.49, lng: 103.80, tz: 8, region: '西南' },
    { name: '玉溪', lat: 24.35, lng: 102.55, tz: 8, region: '西南' },
    // 西北
    { name: '西安', lat: 34.3416, lng: 108.9398, tz: 8, region: '西北' },
    { name: '兰州', lat: 36.0611, lng: 103.8343, tz: 8, region: '西北' },
    { name: '西宁', lat: 36.6171, lng: 101.7782, tz: 8, region: '西北' },
    { name: '银川', lat: 38.4872, lng: 106.2309, tz: 8, region: '西北' },
    { name: '乌鲁木齐', lat: 43.8256, lng: 87.6168, tz: 8, region: '西北' },
    { name: '包头', lat: 40.6577, lng: 109.8404, tz: 8, region: '西北' },
    { name: '喀什', lat: 39.4677, lng: 75.9892, tz: 8, region: '西北' },
    { name: '天水', lat: 34.58, lng: 105.72, tz: 8, region: '西北' },
    { name: '鄂尔多斯', lat: 39.61, lng: 109.78, tz: 8, region: '西北' },
    { name: '克拉玛依', lat: 45.60, lng: 84.89, tz: 8, region: '西北' },
    { name: '伊宁', lat: 43.92, lng: 81.33, tz: 8, region: '西北' },
    { name: '酒泉', lat: 39.74, lng: 98.49, tz: 8, region: '西北' },
    { name: '咸阳', lat: 34.34, lng: 108.71, tz: 8, region: '西北' },
    { name: '宝鸡', lat: 34.36, lng: 107.24, tz: 8, region: '西北' },
    { name: '榆林', lat: 38.29, lng: 109.74, tz: 8, region: '西北' },
    { name: '满洲里', lat: 49.60, lng: 117.40, tz: 8, region: '西北' },
    // 港澳台
    { name: '香港', lat: 22.3193, lng: 114.1694, tz: 8, region: '港澳台' },
    { name: '澳门', lat: 22.1987, lng: 113.5439, tz: 8, region: '港澳台' },
    { name: '台北', lat: 25.0330, lng: 121.5654, tz: 8, region: '港澳台' },
    { name: '高雄', lat: 22.62, lng: 120.30, tz: 8, region: '港澳台' },
    { name: '台中', lat: 24.14, lng: 120.67, tz: 8, region: '港澳台' },
    // 国际
    { name: '东京', lat: 35.6762, lng: 139.6503, tz: 9, region: '国际' },
    { name: '首尔', lat: 37.5665, lng: 126.9780, tz: 9, region: '国际' },
    { name: '新加坡', lat: 1.3521, lng: 103.8198, tz: 8, region: '国际' },
    { name: '曼谷', lat: 13.7563, lng: 100.5018, tz: 7, region: '国际' },
    { name: '孟买', lat: 19.0760, lng: 72.8777, tz: 5.5, region: '国际' },
    { name: '迪拜', lat: 25.2048, lng: 55.2708, tz: 4, region: '国际' },
    { name: '莫斯科', lat: 55.7558, lng: 37.6173, tz: 3, region: '国际' },
    { name: '伦敦', lat: 51.5074, lng: -0.1278, tz: 0, region: '国际' },
    { name: '巴黎', lat: 48.8566, lng: 2.3522, tz: 1, region: '国际' },
    { name: '开罗', lat: 30.0444, lng: 31.2357, tz: 2, region: '国际' },
    { name: '开普敦', lat: -33.9249, lng: 18.4241, tz: 2, region: '国际' },
    { name: '纽约', lat: 40.7128, lng: -74.0060, tz: -5, region: '国际' },
    { name: '洛杉矶', lat: 34.0522, lng: -118.2437, tz: -8, region: '国际' },
    { name: '圣保罗', lat: -23.5505, lng: -46.6333, tz: -3, region: '国际' },
    { name: '悉尼', lat: -33.8688, lng: 151.2093, tz: 10, region: '国际' },
    { name: '奥克兰', lat: -36.85, lng: 174.76, tz: 12, region: '国际' },
    { name: '墨尔本', lat: -37.81, lng: 144.96, tz: 10, region: '国际' },
    { name: '多伦多', lat: 43.65, lng: -79.38, tz: -5, region: '国际' },
    { name: '温哥华', lat: 49.28, lng: -123.12, tz: -8, region: '国际' },
    { name: '墨西哥城', lat: 19.43, lng: -99.13, tz: -6, region: '国际' },
    { name: '伊斯坦布尔', lat: 41.01, lng: 28.98, tz: 3, region: '国际' },
    { name: '雅加达', lat: -6.21, lng: 106.85, tz: 7, region: '国际' },
    { name: '吉隆坡', lat: 3.14, lng: 101.69, tz: 8, region: '国际' },
    { name: '马尼拉', lat: 14.60, lng: 120.98, tz: 8, region: '国际' },
    { name: '河内', lat: 21.03, lng: 105.85, tz: 7, region: '国际' },
    { name: '内罗毕', lat: -1.29, lng: 36.82, tz: 3, region: '国际' },
    { name: '拉各斯', lat: 6.52, lng: 3.38, tz: 1, region: '国际' },
    { name: '旧金山', lat: 37.77, lng: -122.42, tz: -8, region: '国际' },
    { name: '西雅图', lat: 47.61, lng: -122.33, tz: -8, region: '国际' },
    { name: '檀香山', lat: 21.31, lng: -157.86, tz: -10, region: '国际' },
    { name: '马德里', lat: 40.42, lng: -3.70, tz: 1, region: '国际' },
    { name: '罗马', lat: 41.90, lng: 12.50, tz: 1, region: '国际' }
  ];

  function val(c) { return c.lat.toFixed(2) + ',' + c.lng.toFixed(2); }

  function find(v) {
    if (!v) return null;
    for (var i = 0; i < CITIES.length; i++) { if (val(CITIES[i]) === v) return CITIES[i]; }
    return null;
  }

  // 生成 <option>/<optgroup> HTML；sel 为 "lat,lng" 选中值
  function optionsHtml(sel) {
    sel = sel || '39.90,116.40';
    var html = '', last = '__NONE__';
    CITIES.forEach(function (c) {
      if (c.region && c.region !== last) {
        if (last !== '__NONE__') html += '</optgroup>';
        html += '<optgroup label="' + c.region + '">';
        last = c.region;
      }
      html += '<option value="' + val(c) + '"' + (val(c) === sel ? ' selected' : '') + '>' + c.name + '</option>';
    });
    if (last !== '__NONE__') html += '</optgroup>';
    return html;
  }

  window.UPON_CITIES = CITIES;
  window.UPON_Cities_API = { optionsHtml: optionsHtml, find: find, val: val };
})();
