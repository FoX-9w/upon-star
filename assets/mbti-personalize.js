/* =========================================================
   Upon Star — MBTI 个性化解读句（供运势页复用）
   读取 UserStore 中的 mbti 字段，结合 mbti-data.js 生成专属解读句。
   ========================================================= */
(function () {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&', '<': '<', '>': '>', '"': '"', "'": "'" }[c];
    });
  }
  function profile() {
    try { return JSON.parse(localStorage.getItem('uponstar_profile_v1') || 'null'); } catch (e) { return null; }
  }
  // 返回 HTML 片段：已设置 → 专属提示；未设置 → 引导
  function lineHtml() {
    var p = profile();
    if (!p || !p.mbti) {
      return '<div class="mbti-tip">未设置人格类型，运势解读为通用版。<a href="user.html">设置我的 MBTI →</a></div>';
    }
    var M = window.MBTI;
    if (!M || !M.types[p.mbti]) return '';
    var t = M.types[p.mbti];
    var who = p.nickname ? esc(p.nickname) + ' · ' : '';
    return '<div class="mbti-tip on">' + who + '【' + p.mbti + ' ' + esc(t.cn) + '】专属解读：' + esc(t.advice) + '</div>';
  }

  window.MBTIPersonalize = { lineHtml: lineHtml };
})();
