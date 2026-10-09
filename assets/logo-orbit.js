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

  /* ---- 底座坐标系（画布 1767×1510（2026-10-09 裁掉右侧 523px 死白，原 2290 宽））----
     2026-10-09 重绘 logo 后按新图重新标定：拱门内圈椭圆，柱间宽度
     2026-10-09d 轨道放大：rx 440→660 / ry 240→310，星轨掠过立柱外侧，
       视觉上「绕门一周」而非「柱间小圈」（星层 z:2 在柱前，穿过不穿帮） */
  var VW = 1767, VH = 1510;
  var ORBIT = { cx: 1145, cy: 720, rx: 660, ry: 310, rot: -8.8 };
  var REST  = { x: 1145, y: 950 };            /* 星辰盒中心 = 静止位置 */
  var PHI   = ORBIT.rot * Math.PI / 180;

  /* 流星俯冲起点：页面左上角画外 (0,0)。
     静态值只是兜底——boot 时按星辰实际落点的屏幕坐标反算（computeDive），
     任何视口 / 任何舞台尺寸下起点都精确钉在页面左上角，尾迹角度同步反算 */
  var DIVE0 = { x: -1750, y: -2600 };

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
    var DIVE = sec(cs, '--lo-dive', 0);        /* >0 时先流星俯冲入场（intro 专属） */
    var END  = DIVE + T0 + HOOK * 2 + DUR;

    var raf = 0, t0 = 0;

    /* 俯冲起点按「页面左上角 (0,0)」实时反算：
       星辰静止中心的屏幕坐标 / 缩放比 = 所需底座偏移；顺带把尾迹角度
       （起点→落点的屏幕方位角）写进 --lo-tail-ang，供 CSS 尾迹指向起点 */
    function computeDive() {
      if (DIVE <= 0) return;
      try {
        var r = starG.getBoundingClientRect();
        var k = (box.clientWidth || VW) / VW;
        if (r.width > 0 && k > 0) {
          var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          DIVE0.x = -cx / k;
          DIVE0.y = -cy / k;
          starG.style.setProperty('--lo-tail-ang',
            (Math.atan2(cy, cx) * 180 / Math.PI).toFixed(1) + 'deg');
        }
      } catch (e) {}
    }

    function paint(dx, dy, sc) {
      var k = (box.clientWidth || VW) / VW;          /* 底座单位 → CSS px */
      starG.style.transform =
        'translate(' + (dx * k).toFixed(2) + 'px,' + (dy * k).toFixed(2) + 'px) scale(' + sc.toFixed(4) + ')';
    }

    function frame(now) {
      if (!t0) t0 = now;
      var t = (now - t0) / 1000, dx = 0, dy = 0, sc = 1;

      if (DIVE > 0 && t < DIVE) {                    /* 流星俯冲：左上画外 → 中央归位 */
        var p = Math.min(1, t / DIVE);
        var u = 1 - Math.pow(1 - p, 3);              /* ease-out：冲进来减速落定 */
        paint(DIVE0.x * (1 - u), DIVE0.y * (1 - u), 1.30 - .30 * u);
      } else if (t < DIVE + T0) {                    /* 落定稍歇 */
        paint(0, 0, 1);
      } else if (t < DIVE + T0 + HOOK) {             /* 离位：中心 → 接驳点 */
        var u = ease((t - DIVE - T0) / HOOK);
        paint(offX * u, offY * u, 1 + .10 * Math.sin(Math.PI * u));
      } else if (t < DIVE + T0 + HOOK + DUR) {       /* 公转整整一周 */
        var uu = ease((t - DIVE - T0 - HOOK) / DUR);
        var q = pt(TH0 + uu * Math.PI * 2);
        paint(q.x - REST.x, q.y - REST.y, 1);
      } else if (t < END) {                          /* 归返：接驳点 → 中心 */
        var u2 = ease((t - DIVE - T0 - HOOK - DUR) / HOOK);
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

    /* 起幕：挂 .lo-play、摘下 .lo-armed、记下「已看过」；俯冲模式广播事件供画布流星同步 */
    function boot() {
      var de = document.documentElement;
      computeDive();
      de.classList.remove('lo-armed');
      de.classList.add('lo-play');
      if (DIVE > 0) {
        try { document.dispatchEvent(new CustomEvent('logoorbit:dive', { detail: { dur: DIVE } })); } catch (e) {}
      }
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
