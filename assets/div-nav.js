/* =========================================================
   Upon Star — 结果页快捷导航（div-nav）
   职责：
     · 在结果区底部渲染一排快捷按钮（分享 / 返回首页 等）
     · 预设按钮即「分享结果」（呼叫 ShareKit）与「返回首页」
     · 页面可在 #navHost 容器中呼叫 DivNav.mount() 启用
   零外部依赖。
   ========================================================= */
(function(){
  'use strict';
  var DivNav = {};

  // 预设按钮：分享结果 + 返回首页
  function defaultButtons(){
    return [
      { label: '分享结果', action: 'share' },
      { label: '返回首页', href: 'divination-homepage.html' }
    ];
  }

  DivNav.mount = function(opts){
    opts = opts || {};
    var host = document.getElementById(opts.host || 'navHost');
    if(!host) return null;

    var defs = opts.buttons || defaultButtons();
    host.innerHTML = '';
    host.className = 'div-nav';

    defs.forEach(function(d){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'div-nav-btn';
      b.textContent = d.label;

      if(d.href){
        b.addEventListener('click', function(){ location.href = d.href; });
      } else if(d.action === 'share'){
        b.addEventListener('click', function(){
          if(!window.ShareKit){ return; }
          ShareKit.shareCurrent();
        });
      } else if(typeof d.onClick === 'function'){
        b.addEventListener('click', d.onClick);
      }
      host.appendChild(b);
    });
    return host;
  };

  window.DivNav = DivNav;
})();
