/* =========================================================
   Upon Star — 分享连结（Base64 编解码）
   职责：
     · 把解读结果压成最小负载 → Base64 → 写入 URL 的 #r= 片段
     · 解析 #r= 还原结果（供 DivTool.restore 使用）
     · 复制到剪贴簿 + 轻量 toast 提示
   零外部依赖；纯前端，不经任何伺服器。
   ========================================================= */
(function(){
  'use strict';
  var ShareKit = {};

  // 内部工具：HTML 转义（防止结果文字破坏卡片结构）
  function escapeHtml(s){
    if(s == null) return '';
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  // UTF-8 安全 Base64
  function b64encode(obj){
    var json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json)));
  }
  function b64decode(str){
    try { return JSON.parse(decodeURIComponent(escape(atob(str)))); }
    catch(e){ return null; }
  }

  ShareKit.encode = b64encode;
  ShareKit.decode = b64decode;

  // 由结果状态生成可分享的完整 URL（不改变目前页面）
  ShareKit.shareUrl = function(obj){
    var hash = '#r=' + b64encode(obj);
    return location.origin + location.pathname + location.search + hash;
  };

  // 解析当前 URL 中的 #r= 片段；无则返回 null
  ShareKit.getShared = function(){
    var m = location.hash.match(/[#&]r=([^&]+)/);
    if(!m) return null;
    return b64decode(m[1]);
  };

  // 复制文字（优先 Clipboard API，降级 execCommand）
  ShareKit.copy = function(text){
    if(navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function(res){
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
      } catch(e){ /* 忽略：环境不支援复制 */ }
      res();
    });
  };

  // 轻量 toast
  ShareKit.toast = function(msg){
    var t = document.getElementById('shareToast');
    if(!t){
      t = document.createElement('div'); t.id = 'shareToast'; t.className = 'share-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tm);
    t._tm = setTimeout(function(){ t.classList.remove('show'); }, 2200);
  };

  // 把 DivTool.getState() 的结果压成可分享最小负载
  // state: { deck, count, question, picks:[{n, r}] }
  ShareKit.buildPayload = function(state){
    if(!state) return null;
    return {
      v: 1,
      deck: state.deck,
      count: state.count,
      q: state.question || '',
      qc: state.qCat || '',
      p: (state.picks || []).map(function(x){ return [x.n, x.r ? 1 : 0]; })
    };
  };

  // 由分享负载重建为 DivTool 可还原的 state
  ShareKit.toState = function(payload){
    if(!payload) return null;
    return {
      deck: payload.deck,
      count: payload.count,
      question: payload.q || '',
      qCat: payload.qc || '',
      picks: (payload.p || []).map(function(x){ return { n: x[0], r: !!x[1] }; })
    };
  };

  // 挂载「分享」按钮到 target 容器（getState 提供目前结果）
  // 现改为：点击直接弹出「卡片式」分享卡（不再复制连结）
  ShareKit.mountShareButton = function(target, getState){
    if(!target) return null;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'div-nav-btn share-btn';
    btn.textContent = '分享结果';
    btn.addEventListener('click', function(){
      // 若页面提供了 getState 且未登记适配器，则临时登记为 card 适配器
      if(getState && !window.__SHARE_TYPE__ && !(window.DivTool && DivTool.getState)){
        ShareKit.registerAdapter('__btn__', {
          type:'cards',
          getState: function(){ return ShareKit.buildPayload(getState()); },
          emptyHint:'请先完成一次抽牌再分享',
          restore: function(){}
        });
        window.__SHARE_TYPE__ = '__btn__';
      }
      ShareKit.shareCurrent();
    });
    target.appendChild(btn);
    return btn;
  };

  // ===== 通用适配器机制（解耦 DivTool，支援占星 / 八字 等任意页）=====
  // 适配器结构：{ type, getState, emptyHint, restore }
  //   getState()  → 回传可序列化状态物件（无结果时回传 null）
  //   emptyHint   → 尚未出结果时的提示
  //   restore(s)  → 读取状态并重现结果
  ShareKit._adapters = {};

  ShareKit.registerAdapter = function(type, adapter){
    adapter = adapter || {};
    adapter.type = type;
    ShareKit._adapters[type] = adapter;
  };

  // 取得当前页适配器：优先 window.__SHARE_TYPE__，否则回落牌卡（DivTool）
  ShareKit.activeAdapter = function(){
    var t = window.__SHARE_TYPE__;
    if(t && ShareKit._adapters[t]) return ShareKit._adapters[t];
    if(window.DivTool && DivTool.getState){
      return {
        type: 'cards',
        getState: function(){ return ShareKit.buildPayload(DivTool.getState()); },
        emptyHint: '请先完成一次抽牌再分享',
        restore: function(s){ DivTool.restore(ShareKit.toState(s)); }
      };
    }
    return null;
  };

  // ===== 卡片式分享（取代连结分享）=====
  // 由适配器状态建构可读的卡片视图
  ShareKit.buildCard = function(st, type){
    var view = { title:'解读结果', subtitle:'', lines:[], badge:'' };
    if(type === 'cards' && st){
      // st = buildPayload 产物：{ v, deck, count, q, qc, p:[[name, reversed]] }
      var deckName = ({ tarot:'塔罗', lenormand:'雷诺曼' })[st.deck] || st.deck || '';
      view.title = (deckName ? deckName + ' · ' : '') + '解读结果';
      view.subtitle = st.q || '随问随答';
      if(st.qc) view.badge = '【' + st.qc + '】';
      if(st.count) view.badge += (view.badge ? ' ' : '') + st.count + ' 张';
      (st.p || []).forEach(function(it){
        view.lines.push({ label: it[1] ? '逆位' : '正位', value: it[0] });
      });
    } else if(type === 'astro' && st){
      view.title = '本命星盘';
      view.subtitle = (st.year||'') + '.' + (st.month||'') + '.' + (st.day||'') + ' ' + (st.hour!=null?st.hour:'') + ' 时';
      view.lines.push({ label:'出生地', value: (st.lat!=null?st.lat:'?') + '°, ' + (st.lng!=null?st.lng:'?') + '°' });
      if(st.tz!=null) view.lines.push({ label:'时区', value:'UTC' + (st.tz>=0?'+':'') + st.tz });
    } else if(type === 'bazi' && st){
      view.title = '八字排盘';
      view.subtitle = (st.y||'') + '.' + (st.m||'') + '.' + (st.d||'') + ' ' + (st.h!=null?st.h:'') + ' 时';
      view.lines.push({ label:'性别', value: st.gender || '—' });
      if(st.note) view.lines.push({ label:'备注', value: st.note });
    } else if(st && typeof st === 'object'){
      Object.keys(st).slice(0, 8).forEach(function(k){
        var v = st[k];
        if(v && typeof v === 'object') v = JSON.stringify(v);
        view.lines.push({ label: k, value: String(v) });
      });
      view.subtitle = '分享结果';
    }
    return view;
  };

  // 渲染并弹出分享卡片（右下角使用真实微信二维码 assets/wechat-qr.jpg）
  ShareKit.renderCard = function(st, type){
    var view = ShareKit.buildCard(st, type);
    var overlay = document.getElementById('shareOverlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'shareOverlay';
      overlay.className = 'share-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function(e){ if(e.target === overlay) ShareKit.closeCard(); });
      document.addEventListener('keydown', function(e){ if(e.key === 'Escape') ShareKit.closeCard(); });
    }
    var linesHtml = (view.lines || []).map(function(l){
      return '<div class="sc-line"><span class="sc-label">' + escapeHtml(l.label) + '</span><span class="sc-value">' + escapeHtml(l.value) + '</span></div>';
    }).join('');
    var payload = { v: 1, t: type, s: st };
    var url = ShareKit.shareUrl(payload);
    var qrPath = (typeof SHARE_QR_PATH === 'string' ? SHARE_QR_PATH : 'assets/wechat-qr.jpg');
    overlay.innerHTML =
      '<div class="share-card" role="dialog" aria-modal="true" aria-label="分享卡片">' +
        '<button class="sc-close" type="button" aria-label="关闭">×</button>' +
        '<div class="sc-head">' +
          '<div class="sc-brand">UPON STAR</div>' +
          '<div class="sc-tag">解读结果 · 星河指引</div>' +
        '</div>' +
        '<div class="sc-body">' +
          '<h3 class="sc-title">' + escapeHtml(view.title) + '</h3>' +
          (view.subtitle ? '<p class="sc-sub">' + escapeHtml(view.subtitle) + '</p>' : '') +
          (view.badge ? '<div class="sc-badge">' + escapeHtml(view.badge) + '</div>' : '') +
          '<div class="sc-lines">' + linesHtml + '</div>' +
        '</div>' +
        '<div class="sc-foot">' +
          '<div class="sc-foot-left"><p class="sc-slogan">命运的星图，值得与同频的人分享</p></div>' +
          '<div class="sc-qr" aria-label="微信二维码">' +
            '<div class="sc-qr-box"><img src="' + escapeHtml(qrPath) + '" alt="微信二维码" class="sc-qr-img" loading="lazy"></div>' +
            '<div class="sc-qr-text">微信 · uponstar_wx</div>' +
          '</div>' +
        '</div>' +
        '<div class="sc-actions">' +
          '<button class="sc-btn sc-btn--ghost" type="button" data-act="copy">复制分享链接</button>' +
          '<button class="sc-btn sc-btn--solid" type="button" data-act="close">完成</button>' +
        '</div>' +
      '</div>';
    overlay.querySelector('.sc-close').addEventListener('click', function(){ ShareKit.closeCard(); });
    overlay.querySelectorAll('.sc-btn').forEach(function(b){
      b.addEventListener('click', function(){
        var act = b.getAttribute('data-act');
        if(act === 'close'){ ShareKit.closeCard(); }
        else if(act === 'copy'){
          ShareKit.copy(url)
            .then(function(){ ShareKit.toast('分享连结已复制'); })
            .catch(function(){ ShareKit.toast('连结已生成'); });
        }
      });
    });
    requestAnimationFrame(function(){ overlay.classList.add('show'); });
    return overlay;
  };

  ShareKit.closeCard = function(){
    var overlay = document.getElementById('shareOverlay');
    if(overlay){ overlay.classList.remove('show'); }
  };

  // 分享当前结果（由适配器提供状态 → 弹出卡片式分享卡）
  ShareKit.shareCurrent = function(){
    var a = ShareKit.activeAdapter();
    if(!a){ ShareKit.toast('本页暂不支援分享'); return; }
    var st = a.getState ? a.getState() : null;
    if(!st){ ShareKit.toast(a.emptyHint || '请先完成后再分享'); return; }
    ShareKit.renderCard(st, a.type);
  };

  // 页面载入时还原分享结果
  ShareKit.restoreOnLoad = function(){
    var p = ShareKit.getShared();
    if(!p || !p.t) return false;
    var a = ShareKit._adapters[p.t];
    if(!a || !a.restore) return false;
    try { a.restore(p.s); return true; } catch(e){ return false; }
  };

  window.ShareKit = ShareKit;
})();
