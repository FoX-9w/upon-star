/*!
 * Upon Star — 站点通用组件（无依赖）
 * 1. 顶部滚动进度条（2px 金色渐变）
 * 2. 返回顶部按钮（右下圆形，滚动 500px 后出现）
 * 3. 可收起分类导航（默认收起，点「菜单」展开；localStorage 记忆展开偏好；
 *    JS 失效则不挂 .nav-collapsible，导航照常常显，不丢入口）
 * 注入方式：在 </body> 前 <script src="assets/site-util.js"></script>
 */
(function () {
  'use strict';

  if (document.getElementById('scrollProgress') || document.getElementById('backToTop')) return;

  /* ---- 滚动进度条 ---- */
  var progress = document.createElement('div');
  progress.id = 'scrollProgress';
  progress.className = 'scroll-progress';
  progress.setAttribute('role', 'progressbar');
  progress.setAttribute('aria-label', '页面阅读进度');
  progress.setAttribute('aria-hidden', 'true');
  var bar = document.createElement('span');
  bar.className = 'scroll-progress-bar';
  progress.appendChild(bar);
  document.body.appendChild(progress);

  /* ---- 返回顶部 ---- */
  var btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.type = 'button';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', '返回顶部');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  document.body.appendChild(btn);

  var ticking = false;
  function update() {
    var st = window.pageYOffset || document.documentElement.scrollTop || 0;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docH > 0 ? (st / docH) * 100 : 0;
    if (pct > 100) pct = 100;
    bar.style.width = pct + '%';
    if (st > 500) btn.classList.add('show');
    else btn.classList.remove('show');
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', function () {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  update();
})();

/* =========================================================
   3. 可收起分类导航
   给每个 header.site-nav 注入「菜单」开关：
   · 挂 .nav-collapsible → .nav-tabs 藏进右上角下拉面板（样式在 base.css）
   · 默认收起；localStorage[uponstar_nav_open]='1' 时自动展开
   · 点外部 / Esc / 点面板内链接 → 收起
   ========================================================= */
(function () {
  'use strict';

  var KEY = 'uponstar_nav_open';
  var navs = document.querySelectorAll('header.site-nav');
  if (!navs.length) return;

  Array.prototype.forEach.call(navs, function (nav, idx) {
    var tabs = nav.querySelector('.nav-tabs');
    if (!tabs || nav.querySelector('.nav-toggle')) return;   /* 已增强过 / 无分类导航 */

    nav.classList.add('nav-collapsible');
    if (!tabs.id) tabs.id = 'navTabs-' + idx;

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', tabs.id);
    toggle.setAttribute('aria-label', '展开或收起分类导航');
    toggle.innerHTML = '<span>菜单</span><i aria-hidden="true"></i>';
    nav.appendChild(toggle);   /* 布局：brand 左 · 面板浮动 · 开关右 */

    function setOpen(open) {
      nav.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      try { localStorage.setItem(KEY, open ? '1' : '0'); } catch (e) {}
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!nav.classList.contains('nav-open'));
    });
    /* 点面板内链接：跳转前先收起（同页锚点也能收） */
    tabs.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('a')) setOpen(false);
    });
    /* 点外部收起；Esc 收起 */
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('nav-open') && !nav.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('nav-open')) setOpen(false);
    });

    var open = false;
    try { open = localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (open) { nav.classList.add('nav-open'); toggle.setAttribute('aria-expanded', 'true'); }
  });
})();
