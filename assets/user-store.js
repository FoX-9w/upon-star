/* =========================================================
   Upon Star — 用户档案与历史记录（localStorage 本地存储）
   隐私：全部数据仅存于你当前浏览器，不上传任何服务器。
   profile: { nickname, mbti, year, month, day, hour, lat, lng, cityName }
   history: 最近最多 10 条记录 [{ key, kind, title, summary, at }]
   ========================================================= */
(function () {
  'use strict';
  var PK = 'uponstar_profile_v1';
  var HK = 'uponstar_history_v1';
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

  window.UserStore = {
    getProfile: getProfile,
    setProfile: setProfile,
    getRecords: getRecords,
    addRecord: addRecord,
    MAX: MAX
  };
})();
