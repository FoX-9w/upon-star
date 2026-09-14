/* =========================================================
   Upon Star — assets/logo-orbit.js
   徽标「公转一周」入场动效（配 logo-orbit.css）

   · 赛道参数只在这里定义一次：SVG 引导线与星辰运动轨迹都由 ORBIT 派生，
     杜绝「线」与「动」不同步。
   · 入场：星辰自中心离位 → 沿轨道顺时针公转整整一周 → 归返中心（爆闪由 CSS 负责）
   · 时序读自 CSS 的 --lo-t0 / --lo-hook / --lo-dur，与样式同源，改一处即可调速。
   · 默认只在每个会话首次进入播放（sessionStorage 记 loIntro）；
     带 ?intro=1 强制重播；prefers-reduced-motion 直接定格终态。
   · 公开接口：window.LogoOrbit = { mount, init }
   ========================================================= */
(function () {
  'use strict';

  /* ---- 底座坐标系（画布 2290×1510）---- */
  var VW = 2290, VH = 1510;
  var ORBIT = { cx: 1132.5, cy: 729.5, rx: 941, ry: 196, rot: -8.8 };
  var REST  = { x: 1130, y: 911 };            /* 星辰盒中心 = 静止位置 */
  var PHI   = ORBIT.rot * Math.PI / 180;

  function pt(th) {                            /* 椭圆参数 → 底座坐标 */
    var x = ORBIT.rx * Math.cos(th), y = ORBIT.ry * Math.sin(th);
    return { x: ORBIT.cx + x * Math.cos(PHI) - y * Math.sin(PHI),
             y: ORBIT.cy + x * Math.sin(PHI) + y * Math.cos(PHI) };
  }

  /* 缓入缓出：离星不急、归位不顿，掺一点线性起步才不粘 */
  function ease(p) { return .62 * (.5 - .5 * Math.cos(Math.PI * p)) + .38 * p; }

  function sec(cs, name, def) {
    if (!cs) return def;
    var v = parseFloat(cs.getPropertyValue(name));
    return isNaN(v) ? def : v;
  }

  /* ============================================================
     mount —— 绑定一个舞台，返回控制器
     ============================================================ */
  function mount(root) {
    root = root || document.querySelector('[data-lo]');
    if (!root) return null;

    var box     = root.querySelector('.lo-box') || root;
    var starG   = root.querySelector('[data-lo-star]');
    var orbitEl = root.querySelector('[data-lo-orbit]');
    var mark    = root.querySelector('.lo-mark');
    if (!starG || !box) return null;

    /* 轨道引导线：两段半椭圆，与运动同一参数 */
    var A = pt(0), B = pt(Math.PI);
    if (orbitEl) {
      orbitEl.setAttribute('d',
        'M ' + A.x.toFixed(2) + ' ' + A.y.toFixed(2) +
        ' A ' + ORBIT.rx + ' ' + ORBIT.ry + ' ' + ORBIT.rot + ' 1 1 ' + B.x.toFixed(2) + ' ' + B.y.toFixed(2) +
        ' A ' + ORBIT.rx + ' ' + ORBIT.ry + ' ' + ORBIT.rot + ' 1 1 ' + A.x.toFixed(2) + ' ' + A.y.toFixed(2));
    }

    /* 离静止点最近的轨道点：作为进出轨道的接驳点 */
    var ENTRY = null, TH0 = 0, bestD = Infinity;
    for (var i = 0; i < 1440; i++) {
      var th = i / 1440 * Math.PI * 2, p = pt(th);
      var d = (p.x - REST.x) * (p.x - REST.x) + (p.y - REST.y) * (p.y - REST.y);
      if (d < bestD) { bestD = d; TH0 = th; ENTRY = p; }
    }
    var offX = ENTRY.x - REST.x, offY = ENTRY.y - REST.y;

    /* ---- 时序读自 :root，与 CSS 同源 ---- */
    var cs = window.getComputedStyle ? getComputedStyle(document.documentElement) : null;
    var T0   = sec(cs, '--lo-t0',   .50);
    var HOOK = sec(cs, '--lo-hook', .50);
    var DUR  = sec(cs, '--lo-dur', 3.20);
    var END  = T0 + HOOK * 2 + DUR;

    var raf = 0, t0 = 0;

    function paint(dx, dy, sc) {
      var k = (box.clientWidth || VW) / VW;          /* 底座单位 → CSS px */
      starG.style.transform =
        'translate(' + (dx * k).toFixed(2) + 'px,' + (dy * k).toFixed(2) + 'px) scale(' + sc.toFixed(4) + ')';
    }

    function frame(now) {
      if (!t0) t0 = now;
      var t = (now - t0) / 1000, dx = 0, dy = 0, sc = 1;

      if (t < T0) {                                  /* 未起 */
        paint(0, 0, 1);
      } else if (t < T0 + HOOK) {                    /* 离位：中心 → 接驳点 */
        var u = ease((t - T0) / HOOK);
        paint(offX * u, offY * u, 1 + .10 * Math.sin(Math.PI * u));
      } else if (t < T0 + HOOK + DUR) {              /* 公转整整一周 */
        var uu = ease((t - T0 - HOOK) / DUR);
        var q = pt(TH0 + uu * Math.PI * 2);
        paint(q.x - REST.x, q.y - REST.y, 1);
      } else if (t < END) {                          /* 归返：接驳点 → 中心 */
        var u2 = ease((t - T0 - HOOK - DUR) / HOOK);
        paint(offX * (1 - u2), offY * (1 - u2), 1 + .14 * Math.sin(Math.PI * u2));
      } else {                                       /* 落定 */
        paint(0, 0, 1);
        raf = 0;
        return;
      }
      raf = window.requestAnimationFrame(frame);
    }

    function reset() {
      if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
      paint(0, 0, 1);
    }

    function play() {
      t0 = 0;
      if (raf) window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(frame);
      /* 兜底：即使 rAF 被节流，也在行程结束后把星辰钉回中心 */
      window.setTimeout(function () { if (!raf) paint(0, 0, 1); }, (END + .4) * 1000);
      return END;
    }

    /* 起幕：挂 .lo-play、摘下 .lo-armed、记下「已看过」 */
    function boot() {
      var de = document.documentElement;
      de.classList.remove('lo-armed');
      de.classList.add('lo-play');
      try { sessionStorage.setItem('loIntro', '1'); } catch (e) {}
      play();
    }

    /* 缩窗时按新比例重画（仅静止态需要；运动中下一帧自会跟上） */
    window.addEventListener('resize', function () { if (!raf) paint(0, 0, 1); });

    reset();

    return {
      el: root, play: play, reset: reset, boot: boot,
      mark: mark, end: END,
      orbit: ORBIT, rest: REST, entry: ENTRY, th0: TH0
    };
  }

  /* ============================================================
     init —— 自动挂载页面上第一个 [data-lo]，按门控决定是否起幕
     ============================================================ */
  function init() {
    var root = document.querySelector('[data-lo]');
    if (!root || root.dataset.loReady === '1') return;
    root.dataset.loReady = '1';

    var de = document.documentElement;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var forced = /[?&]intro=1\b/.test(location.search);
    var seen = false;
    try { seen = sessionStorage.getItem('loIntro') === '1'; } catch (e) {}

    var inst = mount(root);
    if (!inst) { de.classList.remove('lo-armed'); return; }

    if (reduce || (seen && !forced)) {         /* 直接给最终态，不吃动效 */
      de.classList.remove('lo-armed');
      inst.reset();
      return;
    }

    var mark = inst.mark;
    if (mark && !mark.complete) {              /* 等底座就绪再起幕，避免跑在空面板上 */
      mark.addEventListener('load',  function () { window.setTimeout(inst.boot, 60); }, false);
      mark.addEventListener('error', inst.boot, false);
      window.setTimeout(inst.boot, 1500);      /* 兜底：图挂不上也要起幕 */
    } else {
      window.setTimeout(inst.boot, 30);
    }
  }

  window.LogoOrbit = { mount: mount, init: init };

  /* 脚本置于舞台之后时立即可跑；否则等 DOM 就绪 */
  if (document.querySelector('[data-lo]')) init();
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
