/* =========================================================
   Upon Star — 西方桌布舞台（占星猫式洗牌交互）
   能力：圆形桌布（六芒星 + 星盘环 + 星点）、底部中央牌堆、
   飞牌洗牌动画（3D 翻转 + 随机散开 + 1~2s 聚回）、
   手势：双击/双触洗牌、重力感应摇一摇洗牌、上下滑动空白区切换牌种。
   纯前端、零外部依赖；样式在 assets/west-theme.css（仅西方主题生效）。
   ========================================================= */
(function(){
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs){
    var e = document.createElementNS(SVGNS, tag);
    if(attrs){ for(var k in attrs){ e.setAttribute(k, attrs[k]); } }
    return e;
  }
  function ring(r, dash, op, col){
    return svgEl('circle', { cx:200, cy:200, r:r, fill:'none', stroke:col, 'stroke-opacity':op, 'stroke-width':1, 'stroke-dasharray':(dash||'') });
  }
  function buildBackdrop(){
    var svg = svgEl('svg', { class:'tc-svg', viewBox:'0 0 400 400', 'aria-hidden':'true', preserveAspectRatio:'xMidYMid meet' });
    svg.appendChild(ring(196, null, 0.5, '#E8D5A8'));
    svg.appendChild(ring(170, '2 7', 0.32, '#C9B68C'));
    svg.appendChild(ring(120, null, 0.28, '#E8D5A8'));
    svg.appendChild(ring(78, '1 5', 0.22, '#C9B68C'));
    // 六芒星：两个正三角形
    function tri(rot){
      var pts = [];
      for(var i=0;i<3;i++){
        var a = (-90 + rot + i*120) * Math.PI/180;
        pts.push((200 + 148*Math.cos(a)).toFixed(1) + ',' + (200 + 148*Math.sin(a)).toFixed(1));
      }
      return svgEl('polygon', { points:pts.join(' '), fill:'none', stroke:'#C85A7A', 'stroke-opacity':'0.42', 'stroke-width':'1.2' });
    }
    svg.appendChild(tri(0)); svg.appendChild(tri(180));
    svg.appendChild(svgEl('circle', { cx:200, cy:200, r:4, fill:'#C85A7A', 'fill-opacity':'0.6' }));
    for(var i=0;i<48;i++){
      var a = i*(360/48)*Math.PI/180;
      var big = (i % 6 === 0);
      svg.appendChild(svgEl('circle', {
        cx:(200 + 196*Math.cos(a)).toFixed(1), cy:(200 + 196*Math.sin(a)).toFixed(1),
        r:(big?2:1), fill:'#C9B68C', 'fill-opacity':'0.55'
      }));
    }
    return svg;
  }

  function create(opts){
    opts = opts || {};
    var root = opts.root;
    if(!root) return null;
    var gestureRoot = opts.gestureRoot || root;
    var onShuffle = opts.onShuffle || function(){};
    var onSwitch = opts.onSwitch || function(){};
    var onSwitchTo = opts.onSwitchTo || null;
    var getLabel = opts.getLabel || function(){ return ''; };
    var decks = opts.decks || null;
    var getActive = opts.getActive || null;

    var stage = document.createElement('div'); stage.className = 'tc-stage';
    var backdrop = buildBackdrop();
    var fly = document.createElement('div'); fly.className = 'tc-fly';
    var deck = document.createElement('button'); deck.type = 'button'; deck.className = 'tc-deck';
    deck.setAttribute('aria-label', '牌堆（点击 / 双击 / 摇一摇洗牌）');
    deck.innerHTML = '<span class="tc-deck-face"></span><span class="tc-deck-face"></span><span class="tc-deck-face"></span>';
    var label = document.createElement('div'); label.className = 'tc-label';
    var hint = document.createElement('div'); hint.className = 'tc-hint'; hint.textContent = '点牌堆洗牌 · 双击 / 摇一摇重抽';
    stage.appendChild(backdrop); stage.appendChild(fly); stage.appendChild(deck); stage.appendChild(label); stage.appendChild(hint);
    // 牌种切换（塔罗 ⇄ 雷诺曼）已统一由页面 #deckSwitch 处理，本舞台仅负责洗牌动画与手势
    root.appendChild(stage);

    var animating = false;
    // 可见的「杂乱洗牌」：散开成乱堆 → 反复 riffle → 收拢淡出；结束时呼叫 onDone
    function playShuffle(onDone){
      if(animating){ if(onDone) onDone(); return; }
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reduce){ if(onDone) onDone(); return; }
      animating = true;
      var N = 30;
      var cards = [];
      for(var i=0;i<N;i++){
        var c = document.createElement('div'); c.className = 'tc-card';
        var inner = document.createElement('div'); inner.className = 'tc-card-inner';
        c.appendChild(inner); fly.appendChild(c);
        c._t = { tx:0, ty:0, rot:0 };  // 记录当前位姿，避免动画跳变
        cards.push(c);
      }
      // 产生一组「杂乱」目标位姿：散开 + 随机旋转（牌洗得更清晰杂乱）
      function messy(){
        return cards.map(function(){
          var ang = Math.random()*Math.PI*2;
          var dist = 16 + Math.random()*158;
          return {
            tx:(Math.cos(ang)*dist).toFixed(1),
            ty:(Math.sin(ang)*dist*0.60).toFixed(1),
            rot:(Math.random()*300 - 150).toFixed(1)
          };
        });
      }
      function animateTo(dur, ease, delayBase){
        var tg = messy();
        cards.forEach(function(c, i){
          var t = tg[i], from = c._t;
          c.animate([
            { transform:'translate(-50%,-50%) translate('+from.tx+'px,'+from.ty+'px) rotate('+from.rot+'deg)', opacity:1, offset:0 },
            { transform:'translate(-50%,-50%) translate('+t.tx+'px,'+t.ty+'px) rotate('+t.rot+'deg)', opacity:1, offset:1 }
          ], { duration:dur, easing:ease, fill:'forwards', delay:(delayBase||0) });
          c._t = t;
        });
      }
      // 第一阶段：散开成杂乱牌堆
      animateTo(440, 'cubic-bezier(.2,.7,.3,1)', 0);
      // 第二阶段：反复洗牌（riffle）2 轮，保持杂乱
      setTimeout(function(){ animateTo(300, 'ease-in-out'); }, 540);
      setTimeout(function(){ animateTo(300, 'ease-in-out'); }, 880);
      // 第三阶段：收拢成中央杂乱堆并淡出
      setTimeout(function(){
        cards.forEach(function(c){
          var from = c._t;
          c.animate([
            { transform:'translate(-50%,-50%) translate('+from.tx+'px,'+from.ty+'px) rotate('+from.rot+'deg)', opacity:1, offset:0 },
            { transform:'translate(-50%,-50%) translate('+(Math.random()*24-12).toFixed(1)+'px,'+(Math.random()*24-12).toFixed(1)+'px) rotate('+(Math.random()*40-20).toFixed(1)+'deg)', opacity:1, offset:0.55 },
            { transform:'translate(-50%,-50%) translate(0px,0px) rotate(0deg)', opacity:0, offset:1 }
          ], { duration:520, easing:'ease-in', fill:'forwards', delay:Math.random()*120 });
        });
      }, 1140);
      setTimeout(function(){
        cards.forEach(function(c){ if(c.parentNode) c.parentNode.removeChild(c); });
        animating = false;
        if(onDone) onDone();
      }, 1680);
    }
    function setActive(idx){ /* 牌种分段控制已移除，切换统一由页面 #deckSwitch 处理 */ }
    function setDeckLabel(txt){ label.textContent = txt || ''; setActive(getActive ? getActive() : 0); }
    function doShuffle(){ onShuffle(); }

    function isEmpty(t){
      if(!t || !t.closest) return true;
      return !t.closest('.deck-card,.read-card,button,a,input,select,textarea,.tc-deck,.spread-tabs,.control-row,.reverse-toggle,.question-wrap');
    }

    // 双击（桌面）
    gestureRoot.addEventListener('dblclick', function(e){ if(isEmpty(e.target)){ e.preventDefault(); doShuffle(); } });
    // 双触（移动端）
    var lastTap = 0;
    gestureRoot.addEventListener('touchend', function(e){
      var now = Date.now();
      if(now - lastTap < 300 && isEmpty(e.target)){ doShuffle(); }
      lastTap = now;
    }, { passive:true });

    // 上下滑动仅作洗牌手感，不再用于切换牌种（切换统一由 #deckSwitch 处理）

    // 摇一摇（重力感应）
    function enableShake(){
      if(typeof window.DeviceMotionEvent === 'undefined') return;
      var last = { x:0, y:0, z:0 }, lastT = 0, lastShuffle = 0;
      function handler(e){
        var a = e.accelerationIncludingGravity || e.acceleration; if(!a) return;
        var now = Date.now();
        if(now - lastT < 100) return; var dt = now - lastT; lastT = now;
        var dx = a.x - last.x, dy = a.y - last.y, dz = a.z - last.z; last = { x:a.x, y:a.y, z:a.z };
        var mag = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if(mag > 16 && now - lastShuffle > 1500){ lastShuffle = now; doShuffle(); }
      }
      function attach(){ window.addEventListener('devicemotion', handler); }
      if(typeof DeviceMotionEvent.requestPermission === 'function'){
        var asked = false;
        function ask(){
          if(asked) return; asked = true;
          try{ DeviceMotionEvent.requestPermission().then(function(s){ if(s === 'granted') attach(); }).catch(function(){}); }catch(_){}
        }
        document.addEventListener('click', ask, { once:true });
        document.addEventListener('touchend', ask, { once:true });
      } else { attach(); }
    }

    deck.addEventListener('click', function(){ doShuffle(); });
    setDeckLabel(getLabel());
    enableShake();

    return { playShuffle: playShuffle, setDeckLabel: setDeckLabel, setActive: setActive };
  }

  window.Tablecloth = { create: create, buildBackdrop: buildBackdrop };
})();
