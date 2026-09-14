/* =========================================================
   Upon Star — assets/pair-engine.js
   双人配对综合缘分引擎（纯本地、零外部依赖）
   子模块：MBTI 缘 / 星座（太阳星座）兼容 / 星盘合盘(synastry) / 五行合婚
   每个子函数返回 { idx:0-100, tier, title, text }
   依赖（由页面注入）：window.ASTRO / window.BAZI / window.MBTI
   ========================================================= */
(function (global) {
  'use strict';

  // 12 星座元素（与 astro-engine SIGNS 顺序一致）
  var ELEM = ['火', '土', '风', '水', '火', '土', '风', '水', '火', '土', '风', '水'];
  function elemOf(i) { return ELEM[i]; }
  // 模式：idx%3 → 0 开创 / 1 固定 / 2 变动
  function modOf(i) { return i % 3; }
  var MOD_NAME = ['开创', '固定', '变动'];

  // 元素亲和力（0-100）：同元素 90；火-风、土-水 互补 80；火-土、风-水 中性 65；火-水、土-风 挑战 50
  function elemAffinity(a, b) {
    if (a === b) return 90;
    var comp = { '火': ['风'], '风': ['火'], '土': ['水'], '水': ['土'] };
    if (comp[a] && comp[a].indexOf(b) >= 0) return 80;
    if ((a === '火' && b === '土') || (a === '土' && b === '火') ||
        (a === '风' && b === '水') || (a === '水' && b === '风')) return 65;
    return 50;
  }
  // 模式亲和力：同模式 72（熟悉但易抢节奏），异模式 76（互补）
  function modAffinity(a, b) { return a === b ? 72 : 76; }

  // 通用分档
  function tierOf(idx) {
    if (idx >= 86) return { tier: '天作之合', title: '三观同频，缘分深厚' };
    if (idx >= 72) return { tier: '默契佳偶', title: '相处舒服，互相成就' };
    if (idx >= 58) return { tier: '互补成长', title: '差异中磨合，越处越合' };
    if (idx >= 44) return { tier: '需多磨合', title: '性格有落差，用心经营' };
    return { tier: '差异显著', title: '了解彼此，理性看待' };
  }

  // ---------- 1) MBTI 缘分 ----------
  function mbti(a, b) {
    var pairs = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
    var same = 0, diff = 0, comp = 0;
    pairs.forEach(function (p) {
      var ca = a.indexOf(p[0]) >= 0, cb = b.indexOf(p[0]) >= 0;
      if (ca === cb) same++;
      else { diff++; if (p[0] === 'E' || p[0] === 'T') comp++; }
    });
    var idx = Math.min(99, 40 + same * 11 + diff * 3 + comp * 4);
    var t = tierOf(idx);
    var dim = same === 4 ? '四个维度完全一致，是彼此的镜像' :
      (same === 3 ? '三个维度一致，一个维度互补，是最被看好的"黄金组合"' :
        (same === 2 ? '一半维度契合，一半需要理解' :
          (same === 1 ? '只有一个维度一致，差异是磨合也是火花' : '四个维度都不同，吸引力来自互补的好奇')));
    var text = dim + (comp ? '；其中内外向、思考/情感恰好互补，容易形成"一个主外一个主内"的默契。' : '。');
    return { key: 'mbti', name: 'MBTI 人格缘', idx: idx, tier: t.tier, title: t.title, text: text };
  }

  // ---------- 2) 星座（太阳星座）兼容 ----------
  function zodiac(iA, iB) {
    if (iA == null || iB == null) return null;
    var eA = elemOf(iA), eB = elemOf(iB);
    var mAff = Math.round(elemAffinity(eA, eB) * 0.7 + modAffinity(modOf(iA), modOf(iB)) * 0.3);
    var t = tierOf(mAff);
    var eRel = eA === eB ? '同属' + eA + '象，价值观与情绪频率天然接近' :
      (elemAffinity(eA, eB) >= 80 ? eA + '象与' + eB + '象本就相生相吸（' + (eA === '火' ? '风助火' : eA === '土' ? '水润土' : eA === '风' ? '火带风' : '土养水') + '）' :
        (elemAffinity(eA, eB) >= 65 ? eA + '象与' + eB + '象一快一慢，需要一点翻译' : eA + '象与' + eB + '象世界观错位较大，磨合期更长'));
    var mRel = modOf(iA) === modOf(iB) ? '双方都是' + MOD_NAME[modOf(iA)] + '模式，推进节奏相似但需避免抢同一角色' :
      '一个' + MOD_NAME[modOf(iA)] + '、一个' + MOD_NAME[modOf(iB)] + '，节奏互补、分工不撞车';
    return { key: 'zodiac', name: '星座（太阳）缘', idx: mAff, tier: t.tier, title: t.title, text: eRel + '；' + mRel + '。' };
  }

  // ---------- 3) 星盘合盘 synastry ----------
  function synastry(cA, cB) {
    if (!cA || !cB) return null;
    function pt(chart, key) {
      if (key === 'asc') return { wx: chart.asc.sign.wx, mod: chart.asc.signIdx % 3, lon: chart.asc.lon, name: '上升' };
      var p = null;
      chart.planets.forEach(function (x) { if (x.key === key) p = x; });
      return p ? { wx: p.sign.wx, mod: p.signIdx % 3, lon: p.lon, name: p.name } : null;
    }
    var keys = ['sun', 'moon', 'asc', 'venus', 'mars'];
    var scores = [], hits = [];
    keys.forEach(function (k) {
      var a = pt(cA, k), b = pt(cB, k);
      if (!a || !b) return;
      var s = elemAffinity(a.wx, b.wx) * 0.7 + modAffinity(a.mod, b.mod) * 0.3;
      scores.push(s);
      if (a.wx === b.wx) hits.push(k === 'sun' ? '太阳同元素，核心自我共振' :
        k === 'moon' ? '月亮同元素，情绪需求相通' :
          k === 'asc' ? '上升同元素，给人的第一印象合拍' :
            k === 'venus' ? '金星同元素，爱的表达方式一致' : '火星同元素，行动与吸引力同频');
    });
    var ptsAvg = scores.length ? scores.reduce(function (s, x) { return s + x; }, 0) / scores.length : 60;

    // 跨盘相位：合/六合/三合 为和谐，刑/冲 为张力
    var harm = 0, tense = 0;
    var ASP = [[0, 8], [60, 6], [90, 7], [120, 8], [180, 8]];
    cA.planets.forEach(function (pa) {
      cB.planets.forEach(function (pb) {
        var diff = Math.abs(pa.lon - pb.lon); if (diff > 180) diff = 360 - diff;
        ASP.forEach(function (a) {
          if (Math.abs(diff - a[0]) <= a[1]) {
            if (a[0] === 0 || a[0] === 60 || a[0] === 120) harm++; else tense++;
          }
        });
      });
    });
    var aspectScore = Math.max(0, Math.min(100, 50 + (harm - tense) * 2.5));
    var idx = Math.round(ptsAvg * 0.65 + aspectScore * 0.35);
    var t = tierOf(idx);
    var text = (hits.length ? '亮点是：' + hits.join('、') + '。' : '双方核心行星元素不尽相同，差异正是互补空间。') +
      ' 跨盘相位中和谐相位 ' + harm + ' 组、张力相位 ' + tense + ' 组，' +
      (harm >= tense ? '整体能量顺畅、互相加成。' : '存在需要磨合的拉扯，但张力也带来吸引力。');
    return { key: 'astro', name: '星盘合盘缘', idx: idx, tier: t.tier, title: t.title, text: text, harm: harm, tense: tense };
  }

  // ---------- 4) 五行合婚 ----------
  var SHENG_FALLBACK = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  var KE_FALLBACK = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
  var HE = { '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊' };
  var LIUHE = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
  var LIUCHONG = { '子': '午', '午': '子', '丑': '未', '未': '丑', '寅': '申', '申': '寅', '卯': '酉', '酉': '卯', '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳' };

  function relScore(B, x, y) {
    var SHENG = (B && B.SHENG) || SHENG_FALLBACK;
    var KE = (B && B.KE) || KE_FALLBACK;
    if (x === y) return 78;
    if (SHENG[x] === y || SHENG[y] === x) return 82; // 相生
    if (KE[x] === y || KE[y] === x) return 56;        // 相克
    return 70;
  }
  function relText(x, y) {
    if (x === y) return '比和（同属' + x + '行）';
    var SHENG = SHENG_FALLBACK, KE = KE_FALLBACK;
    if (SHENG[x] === y) return x + '生' + y + '（相生）';
    if (SHENG[y] === x) return y + '生' + x + '（相生）';
    if (KE[x] === y) return x + '克' + y + '（相克）';
    if (KE[y] === x) return y + '克' + x + '（相克）';
    return x + '与' + y + '行';
  }

  function wuxing(bA, bB) {
    if (!bA || !bB) return null;
    var B = global.BAZI || global.window && global.window.BAZI;
    var WG = B.WUXING_GAN, WZ = B.WUXING_ZHI;
    var gA0 = bA.pillars[0].gan, gB0 = bB.pillars[0].gan;       // 年干
    var dgA = bA.dayGan, dgB = bB.dayGan;                       // 日主
    var dzA = bA.pillars[2].zhi, dzB = bB.pillars[2].zhi;       // 日支
    var wA0 = WG[gA0], wB0 = WG[gB0];
    var wdA = WG[dgA], wdB = WG[dgB];

    var yearScore = relScore(B, wA0, wB0);
    var dayScore = HE[dgA] === dgB ? 95 : relScore(B, wdA, wdB);
    var zhiScore = LIUHE[dzA] === dzB ? 86 : (LIUCHONG[dzA] === dzB ? 50 : 70);

    // 五行互补：一方旺行恰为另一方所缺
    var ca = B.countWuXing(bA.pillars), cb = B.countWuXing(bB.pillars);
    var els = ['金', '木', '水', '火', '土'];
    function strongest(c) { var m = '', mv = -1; els.forEach(function (k) { if (c[k] > mv) { mv = c[k]; m = k; } }); return m; }
    var sa = strongest(ca), sb = strongest(cb);
    var compScore;
    if (ca[sa] > 2 && cb[sa] <= 1) compScore = 90;
    else if (cb[sb] > 2 && ca[sb] <= 1) compScore = 90;
    else if (sa === sb && ca[sa] > 2 && cb[sb] > 2) compScore = 60;
    else compScore = 74;

    var idx = Math.round(yearScore * 0.25 + dayScore * 0.35 + zhiScore * 0.15 + compScore * 0.25);
    var t = tierOf(idx);
    var text =
      '年命五行：' + relText(wA0, wB0) + '；' +
      '日主：' + (HE[dgA] === dgB ? '天干五合（' + dgA + dgB + '），天然吸引力强' : relText(wdA, wdB)) + '；' +
      '夫妻宫（日支）：' + (LIUHE[dzA] === dzB ? '六合，感情契合' : (LIUCHONG[dzA] === dzB ? '六冲，需多包容' : '无冲合，平稳')) + '；' +
      '五行分布：' + (compScore >= 85 ? '一方所旺恰补另一方所缺，互补性极佳' :
        compScore <= 62 ? '双方五行偏同，少了互补但也不冲' : '五行各有长短，可互相调和') + '。';
    return { key: 'wuxing', name: '五行合婚缘', idx: idx, tier: t.tier, title: t.title, text: text };
  }

  // ---------- 综合 ----------
  function combine(parts) {
    var valid = parts.filter(function (p) { return p && typeof p.idx === 'number'; });
    var total = valid.length ? Math.round(valid.reduce(function (s, p) { return s + p.idx; }, 0) / valid.length) : 0;
    var t = tierOf(total);
    return { total: total, tier: t.tier, title: t.title, parts: valid };
  }

  var API = { mbti: mbti, zodiac: zodiac, synastry: synastry, wuxing: wuxing, combine: combine, elemOf: elemOf, modOf: modOf };
  global.PairEngine = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
