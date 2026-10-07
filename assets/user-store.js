/* =========================================================
   Upon Star — 用户档案与历史记录（localStorage 本地存储）
   隐私：全部数据仅存于你当前浏览器，不上传任何服务器。
   profile: { nickname, mbti, year, month, day, hour, lat, lng, cityName }
   history: 最近最多 10 条记录 [{ key, kind, title, summary, at }]
   专属印记（2026-10-07）：首次访问生成的匿名稳定标识，
   用于「每日内容每人不同」——同一人同一天结果稳定，
   不同人各自不同；印记不与任何账号/个人信息关联。
   ========================================================= */
(function () {
  'use strict';
  var PK = 'uponstar_profile_v1';
  var HK = 'uponstar_history_v1';
  var UK = 'uponstar_uid_v1';
  var MAX = 10;

  function getProfile() {
    try { var r = localStorage.getItem(PK); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function setProfile(p) {
    try { localStorage.setItem(PK, JSON.stringify(p || {})); } catch (e) {}
  }
  function getRecords() {
    try { var r = localStorage.getItem(HK); return r ? JSON.parse(r) : []; } catch (e) { return []; }
  }
  // 写入一条记录；同 key 覆盖（用于「每日/每月/每周」每期仅留一条）
  function addRecord(rec) {
    rec = rec || {};
    if (!rec.key) return getRecords();
    var arr = getRecords();
    var idx = -1;
    for (var i = 0; i < arr.length; i++) { if (arr[i].key === rec.key) { idx = i; break; } }
    if (idx >= 0) arr[idx] = rec; else arr.unshift(rec);
    if (arr.length > MAX) arr = arr.slice(0, MAX);
    try { localStorage.setItem(HK, JSON.stringify(arr)); } catch (e) {}
    return arr;
  }

  /* ---------- 专属印记 ---------- */
  // 4 位十六进制印记（如 "A3F2"）。首次生成后永久固定于本浏览器。
  // localStorage 不可用（隐私模式/被禁）时返回固定值 —— 全站退回
  // 「同一天同一结果」的旧行为，页面不报错。
  function getUid() {
    try {
      var u = localStorage.getItem(UK);
      if (u && /^[0-9A-F]{4}$/.test(u)) return u;
      var bytes = new Uint8Array(2);
      if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(bytes);
      } else {
        bytes[0] = Math.floor(Math.random() * 256);
        bytes[1] = Math.floor(Math.random() * 256);
      }
      var HEXC = '0123456789ABCDEF';
      var hex = HEXC[bytes[0] >> 4] + HEXC[bytes[0] & 15] +
                HEXC[bytes[1] >> 4] + HEXC[bytes[1] & 15];
      localStorage.setItem(UK, hex);
      return hex;
    } catch (e) { return '0000'; }
  }

  // 个性化日种子：hash(日期种子 + 专属印记) → 32 位无符号整数。
  // 确定性：同印记同日期必得同种子（刷新/回访不变）；不同印记必不同。
  // FNV-1a 32bit，纯整型运算，无依赖。
  function personalSeed(dateSeed) {
    var s = String(dateSeed) + '|' + getUid();
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  window.UserStore = {
    getProfile: getProfile,
    setProfile: setProfile,
    getRecords: getRecords,
    addRecord: addRecord,
    getUid: getUid,
    personalSeed: personalSeed,
    MAX: MAX
  };
})();
