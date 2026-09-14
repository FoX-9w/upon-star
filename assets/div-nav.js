/* ============================================================
   Upon Star · 占卜快捷导航
   在占卜结果页底部显示其他占卜方式的快捷入口
   ============================================================
   用法：
   1. 在页面底部引入此脚本即可
   2. 脚本会自动检测结果区域可见后插入导航
   3. 也可手动调用 DivNav.refresh() 刷新
   ============================================================ */
(function(){
  'use strict';

  function getBasePath() {
    var p = window.location.pathname;
    if (p.indexOf('/fusion/') !== -1) return '../';
    return './';
  }

  var DIVINATION_LINKS = [
    { name: '六爻',    icon: '爻', href: 'liuyao.html',                     color: '#b06040', cat: '东方' },
    { name: '塔罗',    icon: '塔', href: 'tarot.html',                     color: '#5078a0', cat: '西方' },
    { name: '雷诺曼',  icon: '雷', href: 'lenormand.html',                 color: '#5078a0', cat: '西方' },
    { name: '每日运势', icon: '运', href: 'daily-fortune.html',             color: '#c8a45c', cat: '运势' },
    { name: '八字排盘', icon: '八', href: 'fusion/bazi-standalone.html',   color: '#7858a0', cat: '融合' },
    { name: '星盘排盘', icon: '星', href: 'fusion/astrology-standalone.html', color: '#7858a0', cat: '融合' },
    { name: '中西对照', icon: '合', href: 'fusion/fusion-compare.html',     color: '#7858a0', cat: '融合' },
    { name: '留言板',   icon: '留', href: 'guestbook.html',                color: '#c8a45c', cat: '互动' },
    { name: '关于',     icon: '关', href: 'about.html',                    color: '#c8a45c', cat: '平台' },
  ];

  function getCurrentPage() {
    var parts = window.location.pathname.split('/');
    return parts[parts.length - 1];
  }

  var _styleInjected = false;

  function injectStyle() {
    if (_styleInjected) return;
    _styleInjected = true;
    var style = document.createElement('style');
    style.textContent = '\
      .div-quick-nav {\
        margin-top: 36px;\
        padding: 28px 0 8px;\
        text-align: center;\
        border-top: 1px solid rgba(200,164,92,0.08);\
        animation: divNavFadeIn 0.5s ease;\
      }\
      @keyframes divNavFadeIn {\
        from { opacity: 0; transform: translateY(12px); }\
        to { opacity: 1; transform: translateY(0); }\
      }\
      .div-nav-title {\
        font: 400 12px "Outfit", "PingFang SC", sans-serif;\
        letter-spacing: 4px;\
        color: #605850;\
        margin-bottom: 20px;\
        text-transform: uppercase;\
      }\
      .div-nav-grid {\
        display: flex;\
        flex-wrap: wrap;\
        gap: 10px;\
        justify-content: center;\
        max-width: 600px;\
        margin: 0 auto 20px;\
      }\
      .div-nav-item {\
        display: flex;\
        align-items: center;\
        gap: 8px;\
        padding: 10px 16px;\
        border-radius: 999px;\
        border: 1px solid rgba(200,164,92,0.15);\
        background: rgba(12,12,20,0.6);\
        color: #a09888;\
        font: 500 12px "Outfit","PingFang SC",sans-serif;\
        letter-spacing: 1px;\
        cursor: pointer;\
        transition: all 0.3s;\
        text-decoration: none;\
        white-space: nowrap;\
      }\
      .div-nav-item:hover {\
        border-color: rgba(200,164,92,0.4);\
        color: #c8a45c;\
        background: rgba(200,164,92,0.06);\
        transform: translateY(-2px);\
        box-shadow: 0 4px 16px rgba(0,0,0,0.3), 0 0 24px rgba(200,164,92,0.06);\
      }\
      .div-nav-item .div-nav-icon {\
        display: inline-flex;\
        align-items: center;\
        justify-content: center;\
        width: 22px; height: 22px;\
        border-radius: 50%;\
        font-size: 10px;\
        font-weight: 700;\
        color: #040408;\
        flex-shrink: 0;\
      }\
      .div-nav-item .div-nav-cat {\
        font-size: 9px;\
        opacity: 0.5;\
        letter-spacing: 0.5px;\
      }\
      .div-nav-item.is-current {\
        border-color: rgba(200,164,92,0.08);\
        color: #605850;\
        cursor: default;\
        pointer-events: none;\
      }\
      .div-nav-item.is-current .div-nav-icon {\
        opacity: 0.3;\
      }\
      .div-nav-home {\
        display: inline-block;\
        font: 400 11px "Outfit","PingFang SC",sans-serif;\
        letter-spacing: 2px;\
        color: #605850;\
        text-decoration: none;\
        padding: 8px 20px;\
        border-radius: 999px;\
        border: 1px solid rgba(200,164,92,0.1);\
        transition: all 0.3s;\
      }\
      .div-nav-home:hover {\
        color: #c8a45c;\
        border-color: rgba(200,164,92,0.3);\
      }';
    document.head.appendChild(style);
  }

  function buildNav() {
    injectStyle();

    var base = getBasePath();
    var current = getCurrentPage();
    var inFusion = (current === 'bazi-standalone.html' || current === 'astrology-standalone.html' || current === 'fusion-compare.html');

    var nav = document.createElement('div');
    nav.id = 'divQuickNav';
    nav.className = 'div-quick-nav';

    var gridHtml = '';
    DIVINATION_LINKS.forEach(function(link) {
      var href, isCurrent = false;

      if (inFusion) {
        if (link.href.indexOf('fusion/') === 0) {
          href = link.href.replace('fusion/', '');
          isCurrent = (href === current);
        } else {
          href = base + link.href;
        }
      } else {
        href = base + link.href;
        isCurrent = (link.href === current);
      }

      gridHtml += '<a class="div-nav-item' + (isCurrent ? ' is-current' : '') + '" href="' + href + '">' +
        '<span class="div-nav-icon" style="background:' + link.color + '">' + link.icon + '</span>' +
        '<span>' + link.name + '</span>' +
        '<span class="div-nav-cat">' + link.cat + '</span>' +
        '</a>';
    });

    nav.innerHTML =
      '<div class="div-nav-inner">' +
      '<div class="div-nav-title">— 换一种占卜 —</div>' +
      '<div class="div-nav-grid">' + gridHtml + '</div>' +
      '<a class="div-nav-home" href="' + base + 'divination-homepage.html">返回首页</a>' +
      '</div>';

    return nav;
  }

  // 检查结果区域是否可见
  function isResultVisible() {
    var actions = document.querySelector('.result-actions');
    if (actions) {
      return isVisible(actions);
    }
    // 兜底1：检查 phase-result 是否可见
    var pr = document.getElementById('phase-result');
    if (pr && isVisible(pr)) return true;
    // 兜底2：检查 fortune-result 是否已 reveal
    var fr = document.getElementById('fortuneResult');
    if (fr && fr.classList.contains('reveal') && isVisible(fr)) return true;
    return false;
  }

  // 综合可见性检测：display、opacity、可见祖先
  function isVisible(el) {
    if (!el) return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    var node = el;
    while (node && node !== document.documentElement) {
      var cs = getComputedStyle(node);
      if (cs.display === 'none') return false;
      if (parseFloat(cs.opacity) === 0) return false;
      node = node.parentElement;
    }
    return true;
  }

  // 移除已有导航
  function removeNav() {
    var existing = document.getElementById('divQuickNav');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  // 插入或刷新导航
  function refresh() {
    if (!isResultVisible()) {
      removeNav();
      return;
    }

    // 已存在则不重复插入
    if (document.getElementById('divQuickNav')) return;

    var nav = buildNav();

    var actions = document.querySelector('.result-actions');
    if (actions && actions.parentNode) {
      actions.parentNode.insertBefore(nav, actions.nextSibling);
    } else {
      var resultArea = document.getElementById('resultArea') ||
                       document.getElementById('phase-result') ||
                       document.getElementById('fortuneResult');
      if (resultArea) {
        resultArea.appendChild(nav);
      } else {
        document.body.appendChild(nav);
      }
    }
  }

  // ===== 自动检测机制 =====
  // 1. MutationObserver 监听 DOM 变化
  var observer = new MutationObserver(function() {
    refresh();
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    });
  }

  // 2. 轮询检测（处理静态页面 phase 切换等场景）
  var pollCount = 0;
  var maxPolls = 120; // 60秒后停止高频检测
  var pollTimer = setInterval(function() {
    refresh();
    pollCount++;
    if (pollCount >= maxPolls) {
      clearInterval(pollTimer);
      // 切换到低频检测
      pollTimer = setInterval(refresh, 2000);
    }
  }, 500);

  // 暴露 API
  window.DivNav = {
    refresh: refresh,
    init: refresh,
    remove: removeNav
  };

})();
