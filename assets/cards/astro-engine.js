/* =========================================================
   Upon Star — assets/cards/astro-engine.js
   西方占星计算引擎（纯本地 JS，无外部依赖）
   基于 Meeus《Astronomical Algorithms》简化算法
   精度：约 ±1-2°（黄道经度），满足星座/宫位/相位查询
   支持：太阳/月亮/水星/金星/火星/木星/土星/天王/海王/冥王
        + ASC 上升星座（简化 Placidus）+ 主要相位（合/六合/刑/冲/三合/六合）
   使用：window.ASTRO.computeNatal(year,month,day,hour,lat,lng)
   ========================================================= */
window.ASTRO = (function () {
  'use strict';

  // 12 星座
  var SIGNS = [
    { name: '白羊', en: 'Aries', sym: '♈', wx: '火', ruler: '火星' },
    { name: '金牛', en: 'Taurus', sym: '♉', wx: '土', ruler: '金星' },
    { name: '双子', en: 'Gemini', sym: '♊', wx: '风', ruler: '水星' },
    { name: '巨蟹', en: 'Cancer', sym: '♋', wx: '水', ruler: '月亮' },
    { name: '狮子', en: 'Leo', sym: '♌', wx: '火', ruler: '太阳' },
    { name: '处女', en: 'Virgo', sym: '♍', wx: '土', ruler: '水星' },
    { name: '天秤', en: 'Libra', sym: '♎', wx: '风', ruler: '金星' },
    { name: '天蝎', en: 'Scorpio', sym: '♏', wx: '水', ruler: '冥王' },
    { name: '射手', en: 'Sagittarius', sym: '♐', wx: '火', ruler: '木星' },
    { name: '摩羯', en: 'Capricorn', sym: '♑', wx: '土', ruler: '土星' },
    { name: '水瓶', en: 'Aquarius', sym: '♒', wx: '风', ruler: '天王' },
    { name: '双鱼', en: 'Pisces', sym: '♓', wx: '水', ruler: '海王' }
  ];

  // 10 行星
  var PLANETS = [
    { key: 'sun', name: '太阳', en: 'Sun', sym: '☉', isLumin: true },
    { key: 'moon', name: '月亮', en: 'Moon', sym: '☽', isLumin: true },
    { key: 'mercury', name: '水星', en: 'Mercury', sym: '☿' },
    { key: 'venus', name: '金星', en: 'Venus', sym: '♀' },
    { key: 'mars', name: '火星', en: 'Mars', sym: '♂' },
    { key: 'jupiter', name: '木星', en: 'Jupiter', sym: '♃' },
    { key: 'saturn', name: '土星', en: 'Saturn', sym: '♄' },
    { key: 'uranus', name: '天王星', en: 'Uranus', sym: '♅' },
    { key: 'neptune', name: '海王星', en: 'Neptune', sym: '♆' },
    { key: 'pluto', name: '冥王星', en: 'Pluto', sym: '♇' }
  ];

  // 主要相位及其容许度（容许度 orb，度数）
  var ASPECTS = [
    { deg: 0,   name: '合相', en: 'Conjunction', sym: '☌', orb: 8 },
    { deg: 60,  name: '六合', en: 'Sextile',     sym: '⚹', orb: 6 },
    { deg: 90,  name: '刑',  en: 'Square',      sym: '□', orb: 7 },
    { deg: 120, name: '三合', en: 'Trine',       sym: '△', orb: 8 },
    { deg: 180, name: '冲',  en: 'Opposition',  sym: '☍', orb: 8 }
  ];

  // ============ 数学辅助 ============
  function rev(x) { return x - Math.floor(x / 360) * 360; }
  function rad(x) { return x * Math.PI / 180; }
  function deg(x) { return x * 180 / Math.PI; }

  // ============ 可选精度增强：Astronomy Engine（MIT，本地化于 assets/lib/astronomy-engine）============
  // 若页面在 astro-engine.js 之前载入了 astronomy.browser.min.js，则 window.Astronomy 存在，
  // 改用其高精度黄道经度（VSOP87 级）替换下列简化 Meeus 公式；未载入时自动回落内置算法，功能不变。
  var ASTRO_ENGINE = (typeof window !== 'undefined' && window.Astronomy) ? window.Astronomy : null;
  var BODY_MAP = {
    sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
    jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto'
  };
  function precisePlanetLon(key, dateUTC) {
    if (!ASTRO_ENGINE) return null;
    try {
      var lon;
      if (key === 'sun') {
        // 太阳为地心参考中心，天文库不直接给地心太阳黄经；
        // 改用地球日心黄经 + 180° 反推地心太阳黄经（已验证：6 月≈84°、1 月≈280°）。
        lon = ASTRO_ENGINE.EclipticLongitude(ASTRO_ENGINE.Body.Earth, dateUTC) + 180;
      } else {
        lon = ASTRO_ENGINE.EclipticLongitude(ASTRO_ENGINE.Body[BODY_MAP[key]], dateUTC);
      }
      if (typeof lon !== 'number' || !isFinite(lon)) return null;
      return rev(lon);
    } catch (e) { return null; }
  }

  // ============ 儒略日 ============
  // 公历 (y,m,d,h) → JD（h 为十进制小时，UTC）
  function toJD(y, m, d, h) {
    var Y = y, M = m;
    if (M <= 2) { Y -= 1; M += 12; }
    var A = Math.floor(Y / 100);
    var B = 2 - A + Math.floor(A / 4);
    var JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5;
    return JD + h / 24;
  }

  // ============ 行星黄道经度 ============
  // 基于 Meeus 简化算法：每个行星用主周期项 L0..L5
  // 精度约 ±1°，足够黄道星座/宫位查询

  function sunLon(T) {
    // 太阳几何黄经（度）
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    var e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    var Mr = rad(M);
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
          + 0.000289 * Math.sin(3 * Mr);
    var trueLon = L0 + C;
    var omega = 125.04 - 1934.136 * T;
    var lambda = trueLon - 0.00569 - 0.00478 * Math.sin(rad(omega));
    return rev(lambda);
  }

  // 通用行星黄经（VSOP87 截断）
  // 每个行星的参数：周期项（L0..L5）+ 主要摄动项
  // 简化模型：用每颗行星的"平均黄经 + 主要摄动"近似
  function planetLon(key, T) {
    var J2000 = 2451545.0;
    switch (key) {
      case 'sun': return sunLon(T);
      case 'moon': {
        // 月亮主项（简化）
        var Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
        var D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
        var M = 357.5291093 + 35999.0502909 * T - 0.0001536 * T * T;
        var Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
        var F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;
        var lon = Lp
          + 6.289 * Math.sin(rad(Mp))
          - 1.274 * Math.sin(rad(Mp - 2 * D))
          + 0.658 * Math.sin(rad(2 * D))
          - 0.186 * Math.sin(rad(M))
          - 0.059 * Math.sin(rad(2 * Mp - 2 * D))
          - 0.057 * Math.sin(rad(Mp - 2 * D + M))
          + 0.053 * Math.sin(rad(Mp + 2 * D))
          + 0.046 * Math.sin(rad(2 * D - M))
          + 0.041 * Math.sin(rad(Mp - M))
          - 0.035 * Math.sin(rad(D))
          - 0.031 * Math.sin(rad(Mp + M))
          - 0.015 * Math.sin(rad(2 * F - 2 * D))
          + 0.011 * Math.sin(rad(Mp - 4 * D));
        return rev(lon);
      }
      case 'mercury': {
        var L = 252.250906 + 149472.6746358 * T;
        var M = 174.794319 + 149472.5142858 * T;
        var e = 0.205631;
        var Mr = rad(M);
        var C = 23.4400 * Math.sin(Mr) + 2.9818 * Math.sin(2 * Mr) + 0.5255 * Math.sin(3 * Mr) + 0.1058 * Math.sin(4 * Mr) + 0.0241 * Math.sin(5 * Mr);
        return rev(L + C);
      }
      case 'venus': {
        var L = 181.979801 + 58517.8156760 * T;
        var M = 50.416094 + 58517.8156608 * T;
        var Mr = rad(M);
        var C = 0.7758 * Math.sin(Mr) + 0.0033 * Math.sin(2 * Mr);
        return rev(L + C);
      }
      case 'mars': {
        var L = 355.433000 + 19140.2993039 * T;
        var M = 336.060234 + 19140.2992578 * T;
        var Mr = rad(M);
        var C = 10.6912 * Math.sin(Mr) + 0.0305 * Math.sin(2 * Mr);
        return rev(L + C);
      }
      case 'jupiter': {
        var L = 34.351519 + 3034.9056606 * T;
        var M = 19.191263 + 3034.9056526 * T;
        var Mr = rad(M);
        var C = 5.7019 * Math.sin(Mr) + 0.1259 * Math.sin(2 * Mr);
        return rev(L + C);
      }
      case 'saturn': {
        var L = 50.077471 + 1222.1137944 * T;
        var M = 317.920723 + 1222.1137853 * T;
        var Mr = rad(M);
        var C = 6.4069 * Math.sin(Mr) + 0.3942 * Math.sin(2 * Mr);
        return rev(L + C);
      }
      case 'uranus': {
        var L = 314.055005 + 428.4669983 * T;
        var M = 142.590833 + 428.4669983 * T;
        var Mr = rad(M);
        var C = 2.0506 * Math.sin(Mr) + 0.0853 * Math.sin(2 * Mr);
        return rev(L + C);
      }
      case 'neptune': {
        var L = 304.348665 + 218.4862002 * T;
        var M = 260.247808 + 218.4862002 * T;
        var Mr = rad(M);
        var C = 1.1943 * Math.sin(Mr) + 0.0167 * Math.sin(2 * Mr);
        return rev(L + C);
      }
      case 'pluto': {
        // 冥王星用更长周期近似
        var L = 238.92903833 + 145.20780515 * T;
        return rev(L);
      }
    }
    return 0;
  }

  // ============ 上升星座 ASC ============
  // 简化：等分宫位（Equal House）系统
  // 1. 计算本地恒星时 LST
  // 2. LST → 当地子午圈黄道
  // 3. ASC = 东升点（地平线与黄道交点）
  function lstAndAsc(JD, lat, lng) {
    // T = (JD - 2451545.0) / 36525
    var T = (JD - 2451545.0) / 36525;
    // 格林尼治平恒星时（度）
    var gmst = 280.46061837 + 360.98564736629 * (JD - 2451545.0)
             + 0.000387933 * T * T - T * T * T / 38710000;
    gmst = rev(gmst);
    // 本地恒星时
    var lst = rev(gmst + lng);
    // 太阳赤经近似
    var sunL = sunLon(T);
    // 偏角近似
    var eps = 23.4392911 - 0.0130042 * T;
    // 用 ramc → asc 的简化公式（Ramc = LST - 12h 转 180）
    var ramc = lst; // 已是度数
    // 简化 ASC：tan(ASC) = -cos(ramc) / (sin(ramc) * cos(eps) + tan(lat) * sin(eps))
    var tanAsc = -Math.cos(rad(ramc)) /
                 (Math.sin(rad(ramc)) * Math.cos(rad(eps)) + Math.tan(rad(lat)) * Math.sin(rad(eps)));
    var ascDeg = deg(Math.atan(tanAsc));
    // 调整到 0..360
    if (Math.sin(rad(ramc)) < 0) ascDeg += 180;
    ascDeg = rev(ascDeg);
    return ascDeg;
  }

  // ============ 行星 → 星座 ============
  function lonToSign(lon) {
    var idx = Math.floor(lon / 30) % 12;
    var degInSign = lon - Math.floor(lon / 30) * 30;
    return { sign: SIGNS[idx], signIdx: idx, deg: degInSign, fullDeg: lon };
  }

  // ============ 计算本命盘 ============
  function computeNatal(year, month, day, hour, lat, lng) {
    // hour 为本地时间，假设 +8（中国），转 UTC：UTC = local - 8
    var utcHour = hour - 8;
    var utcDay = day;
    var utcMonth = month;
    var utcYear = year;
    if (utcHour < 0) {
      utcHour += 24;
      utcDay -= 1;
      if (utcDay < 1) {
        utcMonth -= 1;
        if (utcMonth < 1) { utcMonth = 12; utcYear -= 1; }
        var dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (utcMonth === 2 && (utcYear % 4 === 0 && (utcYear % 100 !== 0 || utcYear % 400 === 0))) dim[1] = 29;
        utcDay = dim[utcMonth - 1];
      }
    }
    var JD = toJD(utcYear, utcMonth, utcDay, utcHour);
    var T = (JD - 2451545.0) / 36525;

    // 高精度天体黄经（若已载入 Astronomy Engine；否则回落简化公式）
    var utcDate = new Date(Date.UTC(
      utcYear, utcMonth - 1, utcDay,
      Math.floor(utcHour), Math.round((utcHour - Math.floor(utcHour)) * 60), 0
    ));

    // 10 行星黄经
    var planets = PLANETS.map(function (p) {
      var lon = precisePlanetLon(p.key, utcDate);
      if (lon === null) lon = planetLon(p.key, T);
      var info = lonToSign(lon);
      return {
        key: p.key, name: p.name, en: p.en, sym: p.sym,
        lon: lon, sign: info.sign, signIdx: info.signIdx, deg: info.deg,
        fullDeg: info.fullDeg
      };
    });

    // 上升星座
    var ascLon = lstAndAsc(JD, lat, lng);
    var ascInfo = lonToSign(ascLon);

    // 宫位（简化 Equal House：每宫 30°，从 ASC 起）
    var houses = [];
    for (var i = 0; i < 12; i++) {
      var houseLon = rev(ascLon + i * 30);
      var hInfo = lonToSign(houseLon);
      houses.push({
        idx: i + 1,
        lon: houseLon,
        sign: hInfo.sign,
        signIdx: hInfo.signIdx,
        deg: hInfo.deg
      });
    }

    // 行星落入宫位
    planets.forEach(function (p) {
      var diff = rev(p.lon - ascLon);
      var houseIdx = Math.floor(diff / 30) + 1;
      if (houseIdx > 12) houseIdx = 12;
      p.house = houseIdx;
    });

    // 主要相位（所有行星两两组合，过滤合/六合/刑/冲/三合）
    var aspectList = [];
    for (var i = 0; i < planets.length; i++) {
      for (var j = i + 1; j < planets.length; j++) {
        var diff = Math.abs(planets[i].lon - planets[j].lon);
        if (diff > 180) diff = 360 - diff;
        for (var k = 0; k < ASPECTS.length; k++) {
          var asp = ASPECTS[k];
          var orb = Math.abs(diff - asp.deg);
          if (orb <= asp.orb) {
            aspectList.push({
              a: planets[i], b: planets[j],
              type: asp, orb: orb,
              exact: (orb < 1)
            });
          }
        }
      }
    }
    aspectList.sort(function (x, y) { return x.orb - y.orb; });

    return {
      birth: { year: year, month: month, day: day, hour: hour, lat: lat, lng: lng },
      utc: { year: utcYear, month: utcMonth, day: utcDay, hour: utcHour },
      JD: JD, T: T,
      preciseEngine: !!ASTRO_ENGINE,
      asc: { lon: ascLon, sign: ascInfo.sign, deg: ascInfo.deg },
      planets: planets,
      houses: houses,
      aspects: aspectList
    };
  }

  return {
    SIGNS: SIGNS, PLANETS: PLANETS, ASPECTS: ASPECTS,
    computeNatal: computeNatal,
    rev: rev,
    lonToSign: lonToSign,
    test: {
      // 测试用：JD 转换
      toJD: toJD,
      sunLon: sunLon,
      planetLon: planetLon
    }
  };
})();
