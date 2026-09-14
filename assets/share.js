/* ============================================================
   Upon Star · 通用结果分享组件 ShareWidget
   纯原生 JavaScript，无外部依赖
   用法:
     ShareWidget.init({
       title:  '六爻占卜结果',
       type:   'liuyao',  // liuyao/bazi/astrology/tarot/lenormand/fusion/daily
       summary:'占卜结果摘要文本',
       data:   { 结构化数据(可选) }
     });
   分享链接: 将结果编码为 Base64 附加到 URL ?r=xxxx
   ============================================================ */
(function (global) {
  'use strict';

  /* ===== 类型标签映射 ===== */
  var TYPE_LABELS = {
    liuyao: '六爻占卜',
    bazi: '八字排盘',
    astrology: '星盘排盘',
    tarot: '塔罗占卜',
    lenormand: '雷诺曼占卜',
    fusion: '中西融合',
    daily: '每日运势'
  };

  var BRAND = 'UPON STAR';
  var SLOGAN = 'wish upon a star';

  var config = null;     // 当前分享配置
  var dom = {};          // DOM 引用集合
  var injected = false;  // 样式是否已注入

  /* ============================================================
     工具函数
     ============================================================ */

  // UTF-8 安全的 Base64 编解码（支持中文）
  function utf8ToBase64(str) {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      // 回退: 逐字符编码
      var out = '';
      for (var i = 0; i < str.length; i++) {
        out += String.fromCharCode(str.charCodeAt(i));
      }
      return btoa(out);
    }
  }
  function base64ToUtf8(b64) {
    try {
      return decodeURIComponent(escape(atob(b64)));
    } catch (e) {
      try { return atob(b64); } catch (e2) { return ''; }
    }
  }

  // 安全转义（用于 innerHTML 文本）
  function esc(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 复制文本到剪贴板（navigator.clipboard 优先，回退 execCommand）
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('已复制到剪贴板');
      }).catch(function () {
        execCopy(text);
      });
    } else {
      execCopy(text);
    }
  }
  function execCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    toast(ok ? '已复制到剪贴板' : '复制失败，请手动复制');
  }

  // 轻提示
  var toastTimer = null;
  function toast(msg) {
    var t = dom.toast;
    if (!t) {
      t = document.createElement('div');
      t.className = 'sw-toast';
      document.body.appendChild(t);
      dom.toast = t;
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  // 格式化日期
  function formatDate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + day;
  }

  /* ============================================================
     样式注入
     ============================================================ */
  function injectCSS() {
    if (injected) return;
    injected = true;
    var css = '' +
      '.sw-btn-share{' +
        'position:fixed;right:20px;bottom:28px;z-index:9998;' +
        'width:54px;height:54px;border-radius:50%;' +
        'border:1px solid rgba(200,164,92,0.55);' +
        'background:linear-gradient(145deg,rgba(200,164,92,0.22),rgba(200,164,92,0.08));' +
        'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
        'display:flex;align-items:center;justify-content:center;' +
        'cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,0.45),0 0 18px rgba(200,164,92,0.18);' +
        'transition:transform .3s ease,box-shadow .3s ease,opacity .3s ease;' +
        'opacity:0;transform:translateY(16px) scale(.85);' +
        '-webkit-tap-highlight-color:transparent;' +
      '}' +
      '.sw-btn-share.show{opacity:1;transform:translateY(0) scale(1);}' +
      '.sw-btn-share:active{transform:scale(.92);}' +
      '.sw-btn-share svg{width:24px;height:24px;display:block;}' +
      '.sw-btn-share::after{' +
        'content:"";position:absolute;inset:0;border-radius:50%;' +
        'box-shadow:0 0 0 0 rgba(200,164,92,0.35);' +
        'animation:swPulse 2.6s ease-out infinite;pointer-events:none;' +
      '}' +
      '@keyframes swPulse{0%{box-shadow:0 0 0 0 rgba(200,164,92,0.3);}70%{box-shadow:0 0 0 14px rgba(200,164,92,0);}100%{box-shadow:0 0 0 0 rgba(200,164,92,0);}}' +

      '.sw-overlay{' +
        'position:fixed;inset:0;z-index:9999;background:rgba(4,4,8,0.6);' +
        'backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);' +
        'opacity:0;pointer-events:none;transition:opacity .3s ease;' +
      '}' +
      '.sw-overlay.show{opacity:1;pointer-events:auto;}' +

      '.sw-panel{' +
        'position:fixed;left:0;right:0;bottom:0;z-index:10000;' +
        'background:linear-gradient(180deg,#0e0e16,#08080e);' +
        'border-top:1px solid rgba(200,164,92,0.25);' +
        'border-radius:22px 22px 0 0;' +
        'padding:8px 20px calc(20px + env(safe-area-inset-bottom));' +
        'transform:translateY(100%);transition:transform .38s cubic-bezier(.22,.61,.36,1);' +
        'box-shadow:0 -10px 40px rgba(0,0,0,0.5);max-width:520px;margin:0 auto;' +
      '}' +
      '.sw-panel.show{transform:translateY(0);}' +
      '.sw-panel::before{' +
        'content:"";position:absolute;top:8px;left:50%;transform:translateX(-50%);' +
        'width:40px;height:4px;border-radius:2px;background:rgba(200,164,92,0.25);' +
      '}' +
      '.sw-panel-title{' +
        'font:500 13px/1 "SF Pro Text","PingFang SC",system-ui,sans-serif;' +
        'letter-spacing:2px;color:#c8a45c;text-align:center;margin:18px 0 16px;text-transform:uppercase;' +
      '}' +

      '.sw-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px;}' +
      '.sw-action{' +
        'display:flex;flex-direction:column;align-items:center;gap:8px;' +
        'padding:16px 6px;border:1px solid rgba(200,164,92,0.16);' +
        'border-radius:14px;background:rgba(12,12,20,0.6);' +
        'cursor:pointer;transition:border-color .3s,background .3s,transform .2s;' +
        '-webkit-tap-highlight-color:transparent;' +
      '}' +
      '.sw-action:active{transform:scale(.95);}' +
      '.sw-action:hover{border-color:rgba(200,164,92,0.4);background:rgba(200,164,92,0.06);}' +
      '.sw-action-ico{' +
        'width:42px;height:42px;border-radius:50%;' +
        'display:flex;align-items:center;justify-content:center;' +
        'background:rgba(200,164,92,0.1);border:1px solid rgba(200,164,92,0.2);' +
      '}' +
      '.sw-action-ico svg{width:22px;height:22px;display:block;}' +
      '.sw-action-label{font:400 12px/1 "PingFang SC",system-ui,sans-serif;color:#a09888;letter-spacing:.5px;}' +

      '.sw-social{' +
        'display:flex;justify-content:center;gap:16px;padding-top:16px;' +
        'border-top:1px solid rgba(200,164,92,0.1);' +
      '}' +
      '.sw-social-btn{' +
        'width:46px;height:46px;border-radius:50%;border:none;cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;' +
        'transition:transform .2s,opacity .2s;-webkit-tap-highlight-color:transparent;' +
      '}' +
      '.sw-social-btn:active{transform:scale(.9);}' +
      '.sw-social-btn svg{width:26px;height:26px;display:block;}' +
      '.sw-social-wechat{background:#1aad19;}' +
      '.sw-social-qq{background:#12b7f5;}' +
      '.sw-social-weibo{background:#e6162d;}' +
      '.sw-social-tip{font:400 10px "PingFang SC",system-ui,sans-serif;color:#605850;text-align:center;margin-top:10px;letter-spacing:.5px;}' +

      '.sw-close{' +
        'margin-top:14px;width:100%;padding:13px;border:1px solid rgba(200,164,92,0.2);' +
        'border-radius:999px;background:transparent;color:#a09888;' +
        'font:500 13px "PingFang SC",system-ui,sans-serif;letter-spacing:2px;' +
        'cursor:pointer;transition:color .3s,border-color .3s;' +
      '}' +
      '.sw-close:hover{color:#c8a45c;border-color:rgba(200,164,92,0.4);}' +

      '.sw-img-modal{' +
        'position:fixed;inset:0;z-index:10001;background:rgba(4,4,8,0.92);' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'padding:24px;opacity:0;pointer-events:none;transition:opacity .3s ease;' +
      '}' +
      '.sw-img-modal.show{opacity:1;pointer-events:auto;}' +
      '.sw-img-wrap{' +
        'max-width:92vw;max-height:78vh;overflow:auto;border-radius:12px;' +
        'border:1px solid rgba(200,164,92,0.3);box-shadow:0 0 50px rgba(200,164,92,0.12);' +
      '}' +
      '.sw-img-wrap img{display:block;width:100%;height:auto;}' +
      '.sw-img-hint{' +
        'font:400 12px "PingFang SC",system-ui,sans-serif;color:#a09888;' +
        'margin-top:16px;letter-spacing:1px;text-align:center;' +
      '}' +
      '.sw-img-actions{display:flex;gap:12px;margin-top:14px;}' +
      '.sw-img-actions button{' +
        'padding:10px 24px;border-radius:999px;border:1px solid rgba(200,164,92,0.3);' +
        'background:rgba(200,164,92,0.08);color:#e0c078;' +
        'font:500 13px "PingFang SC",system-ui,sans-serif;letter-spacing:1px;cursor:pointer;' +
      '}' +
      '.sw-img-actions .ghost{background:transparent;color:#a09888;border-color:rgba(200,164,92,0.2);}' +

      '.sw-link-modal{' +
        'position:fixed;inset:0;z-index:10001;background:rgba(4,4,8,0.8);' +
        'display:flex;align-items:center;justify-content:center;padding:24px;' +
        'opacity:0;pointer-events:none;transition:opacity .3s ease;' +
      '}' +
      '.sw-link-modal.show{opacity:1;pointer-events:auto;}' +
      '.sw-link-box{' +
        'width:100%;max-width:420px;background:#0c0c14;' +
        'border:1px solid rgba(200,164,92,0.25);border-radius:16px;padding:24px;' +
        'transform:scale(.92);transition:transform .3s ease;' +
      '}' +
      '.sw-link-modal.show .sw-link-box{transform:scale(1);}' +
      '.sw-link-box h4{font:500 15px "PingFang SC",system-ui,sans-serif;color:#c8a45c;margin-bottom:14px;letter-spacing:1px;}' +
      '.sw-link-input{' +
        'width:100%;padding:12px 14px;border:1px solid rgba(200,164,92,0.2);' +
        'border-radius:8px;background:#08080e;color:#a09888;' +
        'font:400 12px/1.6 "SF Mono",monospace;word-break:break-all;resize:none;' +
        'max-height:90px;overflow:auto;' +
      '}' +
      '.sw-link-row{display:flex;gap:10px;margin-top:14px;}' +
      '.sw-link-row button{' +
        'flex:1;padding:11px;border-radius:999px;border:1px solid rgba(200,164,92,0.3);' +
        'background:rgba(200,164,92,0.08);color:#e0c078;' +
        'font:500 13px "PingFang SC",system-ui,sans-serif;letter-spacing:1px;cursor:pointer;' +
      '}' +
      '.sw-link-row .ghost{background:transparent;color:#a09888;border-color:rgba(200,164,92,0.2);}' +

      '.sw-toast{' +
        'position:fixed;left:50%;bottom:120px;transform:translateX(-50%) translateY(10px);' +
        'z-index:10002;background:rgba(12,12,20,0.95);color:#e0c078;' +
        'border:1px solid rgba(200,164,92,0.3);border-radius:999px;' +
        'padding:10px 22px;font:400 13px "PingFang SC",system-ui,sans-serif;' +
        'letter-spacing:1px;box-shadow:0 8px 30px rgba(0,0,0,0.5);' +
        'opacity:0;pointer-events:none;transition:opacity .3s,transform .3s;white-space:nowrap;' +
      '}' +
      '.sw-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}' +

      // 分享结果查看弹窗
      '.sw-view-modal{' +
        'position:fixed;inset:0;z-index:10001;background:rgba(4,4,8,0.85);' +
        'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
        'display:flex;align-items:center;justify-content:center;padding:24px;' +
        'opacity:0;pointer-events:none;transition:opacity .35s ease;' +
      '}' +
      '.sw-view-modal.show{opacity:1;pointer-events:auto;}' +
      '.sw-view-card{' +
        'width:100%;max-width:440px;background:linear-gradient(180deg,#0e0e16,#08080e);' +
        'border:1px solid rgba(200,164,92,0.28);border-radius:18px;padding:30px 26px;' +
        'position:relative;overflow:hidden;transform:scale(.92);transition:transform .35s ease;' +
        'max-height:85vh;overflow-y:auto;' +
      '}' +
      '.sw-view-modal.show .sw-view-card{transform:scale(1);}' +
      '.sw-view-card::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#c8a45c,transparent);opacity:.5;}' +
      '.sw-view-brand{font:400 22px Georgia,serif;color:#c8a45c;letter-spacing:5px;text-align:center;}' +
      '.sw-view-slogan{font:400 11px Georgia,serif;color:#605850;letter-spacing:2px;text-align:center;margin-top:4px;font-style:italic;}' +
      '.sw-view-divider{width:80px;height:1px;margin:18px auto;background:linear-gradient(90deg,transparent,#8a7040,transparent);position:relative;}' +
      '.sw-view-divider::after{content:"";position:absolute;left:50%;top:-2px;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:#c8a45c;}' +
      '.sw-view-type{font:500 12px "PingFang SC",system-ui,sans-serif;letter-spacing:2px;color:#c8a45c;text-align:center;text-transform:uppercase;}' +
      '.sw-view-title{font:400 18px Georgia,"Songti SC",serif;color:#f0ece4;text-align:center;margin:12px 0 16px;}' +
      '.sw-view-summary{font:400 14px/1.9 "Songti SC",Georgia,serif;color:#a09888;white-space:pre-wrap;word-break:break-word;}' +
      '.sw-view-date{font:400 11px "PingFang SC",system-ui,sans-serif;color:#605850;letter-spacing:1px;text-align:center;margin-top:20px;padding-top:14px;border-top:1px solid rgba(200,164,92,0.12);}' +
      '.sw-view-close{margin-top:18px;width:100%;padding:12px;border:1px solid rgba(200,164,92,0.25);border-radius:999px;background:transparent;color:#a09888;font:500 13px "PingFang SC",system-ui,sans-serif;letter-spacing:2px;cursor:pointer;}' +
      '.sw-view-close:hover{color:#c8a45c;border-color:rgba(200,164,92,0.4);}' +

      '@media(max-width:480px){.sw-actions{gap:8px;}.sw-action{padding:14px 4px;}.sw-action-label{font-size:11px;}}' +
      '@media(prefers-reduced-motion:reduce){.sw-btn-share::after{animation:none;}}';
    var style = document.createElement('style');
    style.setAttribute('data-share-widget', '1');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ============================================================
     SVG 图标
     ============================================================ */
  var ICONS = {
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="#e0c078" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.7l7.4-4.3M8.3 13.3l7.4 4.3"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="#e0c078" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5L5 20"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="#e0c078" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="#e0c078" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>',
    wechat: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.5c.96.24 1.96.36 3 .36.26 0 .52-.01.77-.03A4.7 4.7 0 0 1 10 14.5c0-2.9 2.91-5.25 6.5-5.25.26 0 .52.01.77.04C16.62 5.74 13.34 4 9.5 4zM7 8.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm5 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4.5 2.75C13.46 11.25 11 13.13 11 15.5c0 1.5.95 2.81 2.4 3.62L13 21l1.8-1.1c.55.13 1.12.2 1.7.2 3.04 0 5.5-1.88 5.5-4.6 0-2.5-2.46-4.25-5.5-4.25zm-2 3.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm4 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5z"/></svg>',
    qq: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2c-3 0-5 2.2-5 5.2 0 1.3.3 2.3.7 3.2-.5.7-1.4 2-1.7 3.2-.3 1.2-.1 2 .3 2.4.3.3.8.3 1.2 0-.2.6-.4 1.4-.4 2 0 1 .8 1.4 1.4.9.3.5.9 1.1 1.5 1.1h4c.6 0 1.2-.6 1.5-1.1.6.5 1.4.1 1.4-.9 0-.6-.2-1.4-.4-2 .4.3.9.3 1.2 0 .4-.4.6-1.2.3-2.4-.3-1.2-1.2-2.5-1.7-3.2.4-.9.7-1.9.7-3.2 0-3-2-5.2-5-5.2zm-2 5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>',
    weibo: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M10.2 14.6c-2 .2-3.8-.5-3.9-1.6-.2-1.1 1.3-2.2 3.3-2.4 2-.2 3.8.5 3.9 1.6.2 1.1-1.3 2.2-3.3 2.4zm-.4-1.6c-.6.1-1.1-.1-1.2-.4 0-.3.4-.6 1-.7.6-.1 1.1.1 1.2.4 0 .3-.4.6-1 .7zM17.5 8.3c-.3-.1-.5-.2-.4-.5.2-.6-.1-1.1-.1-1.1-.4-1.4-2.2-1-2.2-1 .5.4.6 1 .5 1.4-.1.3-.4.4-.7.5-1.3.3-1.1 1.5-1.1 1.5 1.3-.5 2.7-.2 2.7-.2 1.4.3 1.8 1.5 1.8 1.5.4-.9.8-2.4-.5-2.1zM18.3 5c.7.8 1 1.8.8 2.9 0 0 .7.3 1.1 1 .4.7.4 1.5.4 1.5 1.2-1.9.8-4 .8-4-.3-2.1-2.1-3-2.1-3-1.7-.9-3.4-.3-3.4-.3 1.1.2 1.9.7 2.4 1.9z"/><path d="M9.5 9.5c-3.6.3-6.3 2.6-6 5.1.3 2.5 3.4 4.2 7 3.9 3.6-.3 6.3-2.6 6-5.1-.3-2.5-3.4-4.2-7-3.9z"/></svg>'
  };

  /* ============================================================
     DOM 构建
     ============================================================ */
  function ensureDOM() {
    if (dom.btn) return;
    injectCSS();

    // 悬浮按钮
    var btn = document.createElement('div');
    btn.className = 'sw-btn-share';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', '分享结果');
    btn.innerHTML = ICONS.share;
    btn.addEventListener('click', openPanel);
    document.body.appendChild(btn);
    dom.btn = btn;

    // 遮罩
    var overlay = document.createElement('div');
    overlay.className = 'sw-overlay';
    overlay.addEventListener('click', closePanel);
    document.body.appendChild(overlay);
    dom.overlay = overlay;

    // 面板
    var panel = document.createElement('div');
    panel.className = 'sw-panel';
    panel.innerHTML =
      '<div class="sw-panel-title">分享占卜结果</div>' +
      '<div class="sw-actions">' +
        '<div class="sw-action" data-act="image"><div class="sw-action-ico">' + ICONS.image + '</div><div class="sw-action-label">生成图片</div></div>' +
        '<div class="sw-action" data-act="copy"><div class="sw-action-ico">' + ICONS.copy + '</div><div class="sw-action-label">复制摘要</div></div>' +
        '<div class="sw-action" data-act="link"><div class="sw-action-ico">' + ICONS.link + '</div><div class="sw-action-label">分享链接</div></div>' +
      '</div>' +
      '<div class="sw-social">' +
        '<button class="sw-social-btn sw-social-wechat" data-platform="wechat" aria-label="分享到微信">' + ICONS.wechat + '</button>' +
        '<button class="sw-social-btn sw-social-qq" data-platform="qq" aria-label="分享到QQ">' + ICONS.qq + '</button>' +
        '<button class="sw-social-btn sw-social-weibo" data-platform="weibo" aria-label="分享到微博">' + ICONS.weibo + '</button>' +
      '</div>' +
      '<div class="sw-social-tip">微信内请点击右上角 · · · 进行分享</div>' +
      '<button class="sw-close">取 消</button>';
    document.body.appendChild(panel);
    dom.panel = panel;

    // 事件绑定
    panel.querySelectorAll('.sw-action').forEach(function (el) {
      el.addEventListener('click', function () {
        var act = el.getAttribute('data-act');
        if (act === 'image') generateImage();
        else if (act === 'copy') copySummary();
        else if (act === 'link') showLink();
      });
    });
    panel.querySelectorAll('.sw-social-btn').forEach(function (el) {
      el.addEventListener('click', function () {
        shareTo(el.getAttribute('data-platform'));
      });
    });
    panel.querySelector('.sw-close').addEventListener('click', closePanel);
  }

  function openPanel() {
    if (!config) return;
    dom.overlay.classList.add('show');
    dom.panel.classList.add('show');
  }
  function closePanel() {
    if (dom.overlay) dom.overlay.classList.remove('show');
    if (dom.panel) dom.panel.classList.remove('show');
  }

  /* ============================================================
     文字摘要生成
     ============================================================ */
  function buildSummaryText() {
    if (!config) return '';
    var typeLabel = TYPE_LABELS[config.type] || '占卜结果';
    var date = formatDate(new Date());
    var lines = [];
    lines.push('【Upon Star · ' + typeLabel + '】');
    if (config.title) lines.push(config.title);
    lines.push('');
    if (config.summary) lines.push(config.summary);
    lines.push('');
    lines.push('— Upon Star · wish upon a star —');
    lines.push(date);
    lines.push(buildShareLink());
    return lines.join('\n');
  }

  function copySummary() {
    copyText(buildSummaryText());
  }

  /* ============================================================
     分享链接生成与解析
     ============================================================ */
  function buildShareLink() {
    if (!config) return '';
    var payload = {
      t: config.type,
      ti: config.title || '',
      s: config.summary || '',
      d: config.data || null,
      dt: Date.now()
    };
    var encoded = utf8ToBase64(JSON.stringify(payload));
    var base = location.href.split('?')[0].split('#')[0];
    return base + '?r=' + encoded;
  }

  function showLink() {
    var link = buildShareLink();
    var modal = document.createElement('div');
    modal.className = 'sw-link-modal';
    modal.innerHTML =
      '<div class="sw-link-box">' +
        '<h4>分享链接</h4>' +
        '<div class="sw-link-input" id="swLinkText">' + esc(link) + '</div>' +
        '<div class="sw-link-row">' +
          '<button class="ghost" id="swLinkClose">关 闭</button>' +
          '<button id="swLinkCopy">复 制 链 接</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add('show'); });

    function close() {
      modal.classList.remove('show');
      setTimeout(function () {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      }, 300);
    }
    modal.querySelector('#swLinkClose').addEventListener('click', close);
    modal.querySelector('#swLinkCopy').addEventListener('click', function () {
      copyText(link);
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });
  }

  /* ============================================================
     社交分享
     ============================================================ */
  function shareTo(platform) {
    var link = buildShareLink();
    var typeLabel = TYPE_LABELS[config.type] || '占卜结果';
    var title = 'Upon Star · ' + typeLabel;
    // 摘要截取前 60 字作为描述
    var desc = (config.summary || '').replace(/\n/g, ' ').slice(0, 60);

    if (platform === 'wechat') {
      // 微信浏览器内可通过 JSBridge 调起分享
      if (typeof global.WeixinJSBridge !== 'undefined') {
        try {
          global.WeixinJSBridge.invoke('shareTimeline', {
            title: title, link: link, desc: desc, img_url: ''
          }, function () {});
          global.WeixinJSBridge.invoke('shareAppMessage', {
            title: title, link: link, desc: desc
          }, function () {});
          toast('请选择分享到朋友圈或好友');
          return;
        } catch (e) {}
      }
      // 非微信环境：复制链接并提示
      copyText(link);
      setTimeout(function () { toast('链接已复制，请在微信中粘贴分享'); }, 300);
    } else if (platform === 'qq') {
      var qqUrl = 'https://connect.qq.com/widget/shareqq/index.html?url=' +
        encodeURIComponent(link) + '&title=' + encodeURIComponent(title) +
        '&desc=' + encodeURIComponent(desc) + '&summary=' + encodeURIComponent(desc);
      openShareWindow(qqUrl, link);
    } else if (platform === 'weibo') {
      var wbUrl = 'https://service.weibo.com/share/share.php?url=' +
        encodeURIComponent(link) + '&title=' + encodeURIComponent(title + ' ' + desc);
      openShareWindow(wbUrl, link);
    }
  }

  function openShareWindow(url, fallbackLink) {
    try {
      var w = window.open(url, '_blank', 'width=600,height=520');
      if (!w) {
        // 弹窗被拦截，回退复制链接
        copyText(fallbackLink);
        toast('链接已复制，请粘贴到对应平台分享');
      }
    } catch (e) {
      copyText(fallbackLink);
      toast('链接已复制，请粘贴到对应平台分享');
    }
  }

  /* ============================================================
     Canvas 分享图片生成
     ============================================================ */
  function generateImage() {
    toast('正在生成分享图片...');
    try {
      var canvas = drawShareCard();
      var dataUrl = canvas.toDataURL('image/png');
      showImageModal(dataUrl);
    } catch (e) {
      toast('图片生成失败');
    }
  }

  // 中文文本自动换行
  function wrapText(ctx, text, maxWidth) {
    var lines = [];
    var paragraphs = String(text).split('\n');
    for (var p = 0; p < paragraphs.length; p++) {
      var para = paragraphs[p];
      if (para === '') { lines.push(''); continue; }
      var current = '';
      for (var i = 0; i < para.length; i++) {
        var test = current + para[i];
        if (ctx.measureText(test).width > maxWidth && current !== '') {
          lines.push(current);
          current = para[i];
        } else {
          current = test;
        }
      }
      if (current !== '') lines.push(current);
    }
    return lines;
  }

  function drawShareCard() {
    var W = 750, H = 1334;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    // 中文字体栈
    var fontCN = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","WenQuanYi Micro Hei","Noto Sans CJK SC",sans-serif';
    var fontSerif = '"Songti SC","STSong","SimSun","Noto Serif CJK SC",Georgia,serif';
    var fontDisplay = 'Georgia,"Songti SC",serif';

    var gold = '#c8a45c';
    var goldLight = '#e0c078';
    var goldDim = '#8a7040';
    var ink = '#f0ece4';
    var inkDim = '#a09888';
    var muted = '#605850';
    var bg1 = '#040408';
    var bg2 = '#0c0c14';

    // ===== 背景 =====
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, bg2);
    bgGrad.addColorStop(0.5, bg1);
    bgGrad.addColorStop(1, bg2);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 顶部光晕
    var glow = ctx.createRadialGradient(W / 2, 120, 20, W / 2, 120, 480);
    glow.addColorStop(0, 'rgba(200,164,92,0.10)');
    glow.addColorStop(0.5, 'rgba(200,164,92,0.03)');
    glow.addColorStop(1, 'rgba(200,164,92,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 600);

    // ===== 装饰边框 =====
    var m = 40;
    // 外框
    ctx.strokeStyle = 'rgba(200,164,92,0.35)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, m, m, W - m * 2, H - m * 2, 18);
    ctx.stroke();
    // 内框
    ctx.strokeStyle = 'rgba(200,164,92,0.18)';
    ctx.lineWidth = 1;
    roundRect(ctx, m + 10, m + 10, W - m * 2 - 20, H - m * 2 - 20, 12);
    ctx.stroke();

    // 四角装饰
    drawCorner(ctx, m + 6, m + 6, 1, 1, gold);
    drawCorner(ctx, W - m - 6, m + 6, -1, 1, gold);
    drawCorner(ctx, m + 6, H - m - 6, 1, -1, gold);
    drawCorner(ctx, W - m - 6, H - m - 6, -1, -1, gold);

    // ===== 顶部品牌 =====
    var cx = W / 2;
    var y = 130;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // UPON STAR
    ctx.font = '400 46px ' + fontDisplay;
    ctx.fillStyle = gold;
    ctx.fillText('UPON STAR', cx, y);

    // slogan
    ctx.font = 'italic 400 20px ' + fontDisplay;
    ctx.fillStyle = goldDim;
    ctx.fillText('wish upon a star', cx, y + 42);

    // 装饰分隔线
    drawDivider(ctx, cx, y + 90, 200, gold);

    // ===== 占卜类型 =====
    var typeLabel = TYPE_LABELS[config.type] || '占卜结果';
    y = y + 150;

    // 类型徽章
    var badgeText = typeLabel;
    ctx.font = '500 22px ' + fontCN;
    var badgeW = ctx.measureText(badgeText).width + 56;
    var badgeH = 46;
    ctx.fillStyle = 'rgba(200,164,92,0.08)';
    ctx.strokeStyle = 'rgba(200,164,92,0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, cx - badgeW / 2, y - badgeH / 2, badgeW, badgeH, badgeH / 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = goldLight;
    ctx.fillText(badgeText, cx, y);

    // ===== 标题 =====
    y = y + 70;
    if (config.title) {
      ctx.font = '400 30px ' + fontSerif;
      ctx.fillStyle = ink;
      var titleLines = wrapText(ctx, config.title, W - m * 2 - 80);
      for (var ti = 0; ti < titleLines.length && ti < 2; ti++) {
        ctx.fillText(titleLines[ti], cx, y + ti * 42);
      }
      y = y + titleLines.length * 42 + 8;
    }

    // 小分隔
    drawDivider(ctx, cx, y, 120, goldDim);
    y = y + 50;

    // ===== 摘要内容区 =====
    var contentTop = y;
    var contentH = H - contentTop - 260;
    var summary = config.summary || '';

    ctx.font = '400 27px ' + fontSerif;
    ctx.fillStyle = inkDim;
    var lines = wrapText(ctx, summary, W - m * 2 - 100);

    var lineHeight = 46;
    var maxLines = Math.floor(contentH / lineHeight);
    var displayLines = lines.slice(0, maxLines);
    // 末行省略
    if (lines.length > maxLines && displayLines.length > 0) {
      var last = displayLines[displayLines.length - 1];
      while (ctx.measureText(last + '…').width > W - m * 2 - 100 && last.length > 0) {
        last = last.slice(0, -1);
      }
      displayLines[displayLines.length - 1] = last + '…';
    }

    var startY = contentTop;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (var li = 0; li < displayLines.length; li++) {
      ctx.fillText(displayLines[li], m + 50, startY + li * lineHeight);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // ===== 底部日期与品牌 =====
    var footerY = H - 150;
    drawDivider(ctx, cx, footerY, 160, goldDim);
    footerY += 50;

    ctx.font = '400 22px ' + fontCN;
    ctx.fillStyle = muted;
    ctx.fillText(formatDate(new Date()), cx, footerY);

    footerY += 40;
    ctx.font = 'italic 400 16px ' + fontDisplay;
    ctx.fillStyle = goldDim;
    ctx.fillText('Upon Star · 星辰指引', cx, footerY);

    // ===== 星点装饰 =====
    drawStars(ctx, W, H, gold);

    return canvas;
  }

  // 圆角矩形路径
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 四角装饰花纹
  function drawCorner(ctx, x, y, dx, dy, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dx, dy);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.6;
    // L 形线条
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.lineTo(0, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();
    // 小圆点
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // 弧线装饰
    ctx.beginPath();
    ctx.arc(14, 14, 8, Math.PI, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
  }

  // 分隔线（带中心菱形）
  function drawDivider(ctx, cx, cy, width, color) {
    var half = width / 2;
    var grad = ctx.createLinearGradient(cx - half, cy, cx + half, cy);
    grad.addColorStop(0, 'rgba(200,164,92,0)');
    grad.addColorStop(0.3, color);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, 'rgba(200,164,92,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - half, cy);
    ctx.lineTo(cx + half, cy);
    ctx.stroke();
    // 中心菱形
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }

  // 星点装饰
  function drawStars(ctx, W, H, color) {
    var pts = [
      [110, 320, 1.5, 0.5], [640, 360, 1.2, 0.35], [680, 760, 1.8, 0.45],
      [90, 820, 1.3, 0.4], [620, 1000, 1.5, 0.3], [120, 1050, 1.1, 0.35],
      [700, 480, 1, 0.25], [60, 580, 1.2, 0.3]
    ];
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      ctx.fillStyle = color;
      ctx.globalAlpha = p[3];
      ctx.beginPath();
      ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function showImageModal(dataUrl) {
    var modal = document.createElement('div');
    modal.className = 'sw-img-modal';
    modal.innerHTML =
      '<div class="sw-img-wrap"><img src="' + dataUrl + '" alt="分享图片"/></div>' +
      '<div class="sw-img-hint">长按图片保存到相册</div>' +
      '<div class="sw-img-actions">' +
        '<button class="ghost" id="swImgClose">关 闭</button>' +
        '<button id="swImgDownload">保存图片</button>' +
      '</div>';
    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add('show'); });

    function close() {
      modal.classList.remove('show');
      setTimeout(function () {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      }, 300);
    }
    modal.querySelector('#swImgClose').addEventListener('click', close);
    modal.querySelector('#swImgDownload').addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'upon-star-share.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast('已开始下载');
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });
  }

  /* ============================================================
     分享结果查看（URL 参数解析）
     ============================================================ */
  function getQueryParam(name) {
    var match = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
    return match ? match[1] : null;
  }

  function parseSharedResult() {
    var raw = getQueryParam('r');
    if (!raw) return null;
    try {
      var json = base64ToUtf8(raw);
      var payload = JSON.parse(json);
      if (payload && (payload.s || payload.ti || payload.t)) {
        return {
          type: payload.t || '',
          title: payload.ti || '',
          summary: payload.s || '',
          data: payload.d || null,
          date: payload.dt ? new Date(payload.dt) : null
        };
      }
    } catch (e) {}
    return null;
  }

  function showSharedResult(result) {
    if (!result) return;
    injectCSS();
    var typeLabel = TYPE_LABELS[result.type] || '占卜结果';
    var dateStr = result.date ? formatDate(result.date) : formatDate(new Date());

    var modal = document.createElement('div');
    modal.className = 'sw-view-modal';
    modal.innerHTML =
      '<div class="sw-view-card">' +
        '<div class="sw-view-brand">UPON STAR</div>' +
        '<div class="sw-view-slogan">wish upon a star</div>' +
        '<div class="sw-view-divider"></div>' +
        '<div class="sw-view-type">' + esc(typeLabel) + '</div>' +
        (result.title ? '<div class="sw-view-title">' + esc(result.title) + '</div>' : '') +
        '<div class="sw-view-summary">' + esc(result.summary) + '</div>' +
        '<div class="sw-view-date">' + esc(dateStr) + ' · 来自 Upon Star 分享</div>' +
        '<button class="sw-view-close">查 看 完 整 结 果</button>' +
      '</div>';
    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add('show'); });

    modal.querySelector('.sw-view-close').addEventListener('click', function () {
      modal.classList.remove('show');
      setTimeout(function () {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
        // 清除 URL 中的 r 参数
        try {
          var cleanUrl = location.href.split('?')[0].split('#')[0];
          history.replaceState(null, '', cleanUrl);
        } catch (e) {}
      }, 350);
    });
  }

  // 页面加载时自动检测分享参数
  function autoCheckShared() {
    var result = parseSharedResult();
    if (result) {
      // 延迟以等待页面渲染完成
      setTimeout(function () { showSharedResult(result); }, 600);
    }
  }

  /* ============================================================
     公共 API
     ============================================================ */
  global.ShareWidget = {
    /**
     * 初始化分享组件
     * @param {Object} options
     *   - title:   结果标题
     *   - type:    占卜类型 liuyao/bazi/astrology/tarot/lenormand/fusion/daily
     *   - summary: 结果摘要文本（支持换行）
     *   - data:    结构化数据（可选，随分享链接一起编码）
     */
    init: function (options) {
      options = options || {};
      config = {
        title: options.title || '',
        type: options.type || '',
        summary: options.summary || '',
        data: options.data || null
      };
      ensureDOM();
      // 显示悬浮按钮（带渐入动画）
      requestAnimationFrame(function () {
        dom.btn.classList.add('show');
      });
    },

    /** 更新分享配置（无需重建按钮） */
    update: function (options) {
      if (!config) { this.init(options); return; }
      if (options.title !== undefined) config.title = options.title;
      if (options.type !== undefined) config.type = options.type;
      if (options.summary !== undefined) config.summary = options.summary;
      if (options.data !== undefined) config.data = options.data;
    },

    /** 隐藏悬浮按钮 */
    hide: function () {
      if (dom.btn) dom.btn.classList.remove('show');
    },

    /** 解析当前 URL 中的分享参数 */
    parseSharedResult: parseSharedResult,

    /** 生成分享链接 */
    buildShareLink: function () {
      if (!config) return '';
      return buildShareLink();
    },

    /** 生成分享图片 dataURL */
    buildShareImage: function () {
      if (!config) return '';
      return drawShareCard().toDataURL('image/png');
    },

    /** 直接打开分享面板 */
    open: openPanel,

    /** 版本号 */
    version: '1.0.0'
  };

  /* ===== 自动检测分享参数 ===== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoCheckShared);
  } else {
    autoCheckShared();
  }
})(typeof window !== 'undefined' ? window : this);
