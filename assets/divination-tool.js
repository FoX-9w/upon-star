/* =========================================================
   Upon Star — 通用探索工具控制器（塔罗 / 雷诺曼 共用）
   职责：
     · 可旋转圆环选牌（全部牌张围成一圈，拖曳旋转、点环上牌选入）
     · 牌阵切换、逆位（可选）、牌阵结果区（仅塔罗）
     · 桌布（占星猫）洗牌互动：双击 / 双触 / 摇一摇洗牌
     · 上下滑动（或点击桌布标题）在塔罗 ↔ 雷诺曼间切换牌种
   零外部依赖；所有计算于本机完成。
   ========================================================= */
(function(){
  'use strict';

  function escapeHtml(s){
    var d = document.createElement('div'); d.textContent = (s == null ? '' : s); return d.innerHTML;
  }

  // 提问领域情境化解读（供「问题导向解读」区块使用）
  var QUESTION_CONTEXTS = {
    love:     { label:'感情 · 爱情关系', lead:'在感情与关系中，这张牌', revLead:'逆位时，这张牌提醒你感情里' },
    career:   { label:'事业 · 工作发展', lead:'于事业与工作层面，这张牌', revLead:'逆位时，它在工作上' },
    wealth:   { label:'财运 · 金钱物质', lead:'就财运与金钱而言，这张牌', revLead:'逆位时，它在财务上' },
    health:   { label:'健康 · 身心状态', lead:'关于身心状态，这张牌',     revLead:'逆位时，它在健康上' },
    study:    { label:'学业 · 考试进修', lead:'就学业与进修而言，这张牌', revLead:'逆位时，它在学习上' },
    decision: { label:'决策 · 当前抉择', lead:'面对眼前的抉择，这张牌',   revLead:'逆位提醒你，这项决策' }
  };

  // 圆环几何（逻辑座标，由 .ring-scaler 负责缩放以贴合容器）
  var RING_CENTER = 500;   // 逻辑舞台中心（1000×1000 内）
  var RING_RADIUS = 380;   // 卡牌中心所在的圆半径

  function DivTool(){}

  DivTool.init = function(cfg){
    var decks = cfg && cfg.decks;
    if(!decks || !decks.length) return;

    // 过滤出数据就绪的牌组
    var valid = decks.filter(function(d){
      return d && d.data && d.data.cards && d.data.cards.length;
    });
    if(!valid.length){
      var dh = document.getElementById('deckHint');
      if(dh) dh.textContent = '卡牌数据载入失败，请确认对应的 cards/*.js。';
      return;
    }

    // DOM 引用
    var deckEl       = document.getElementById('deck');
    var counterEl    = document.getElementById('counter');
    var gridEl       = document.getElementById('grid');
    var actionsEl    = document.getElementById('actions');
    var metaNote     = document.getElementById('metaNote');
    var deckHint     = document.getElementById('deckHint');
    var shuffleBtn   = document.getElementById('shuffleBtn');
    var redoBtn      = document.getElementById('redoBtn');
    var questionEl   = document.getElementById('question');
    var questionSelEl= document.getElementById('questionSel');
    var spreadTabsEl = document.getElementById('spreadTabs');
    var revWrap      = document.getElementById('revWrap');
    var revChk       = document.getElementById('revChk');
    var revToggle    = document.getElementById('revToggle');
    var tcMount      = document.getElementById('tcMount');
    var heroKicker   = document.querySelector('.tool-hero .kicker');
    var heroTitle    = document.querySelector('.tool-hero h1');
    var heroLead     = document.querySelector('.tool-hero .lead');
    var bcTail       = document.getElementById('bcTail');
    var deckSwitchEl = document.getElementById('deckSwitch');

    // 圆环内部结构（renderDeck 时建立）
    var scaler = null;
    var core   = null;

    var startIdx = 0;
    for(var i=0;i<valid.length;i++){ if(valid[i].key === cfg.startKey){ startIdx = i; break; } }

    var activeIdx = startIdx;
    var DATA   = valid[activeIdx].data;
    var target = valid[activeIdx].defaultCount || 1;
    var deckOrder = [];
    var baseAngles = {};      // ci -> 基础角度（deg）
    var selected = [];
    var reversedMap = {};
    var tc = null;

    // 旋转状态
    var ringAngle = 0;
    var dragging = false, dragMoved = false, lastAngle = 0, startX = 0, startY = 0;
    var suppressClickUntil = 0;
    var rafPending = false, pendingDelta = 0;

    function cur(){ return valid[activeIdx]; }

    function shuffleArray(a){
      for(var i=a.length-1;i>0;i--){
        var j = Math.floor(Math.random()*(i+1));
        var t=a[i]; a[i]=a[j]; a[j]=t;
      }
      return a;
    }
    function buildDeckOrder(){ deckOrder = shuffleArray(DATA.cards.map(function(_,i){ return i; })); }

    // 建立正面内容：有图（art 或 img 非空）则 <img>，无图则占位卡
    function buildFront(card){
      if(card.art || (card.img && card.img.length > 0)){
        var f = document.createElement('img');
        f.alt = (card.name || '卡牌') + ' 正面';
        f.loading = 'lazy';
        if(card.img && card.img.length > 0 && !card.art){ f.src = card.img; } // 雷诺曼：图即档案，立即载入
        return f;
      }
      var d = document.createElement('div');
      d.className = 'ph-card';
      d.innerHTML = '<div class="ph-name"></div><div class="ph-tag">图像生成中</div>';
      d.querySelector('.ph-name').textContent = (card.nameCn || '') + ' ' + (card.name || '');
      return d;
    }

    // 依当前 ringAngle 计算并写入每张卡的 transform（保持萤幕正向）
    function positionCard(el, ci){
      var a = (baseAngles[ci] || 0) + ringAngle;
      el.style.transform = 'translate(-50%,-50%) rotate(' + a + 'deg) translate(' + RING_RADIUS + 'px) rotate(' + (-a) + 'deg)';
    }
    function layoutRing(){
      if(!scaler) return;
      var cards = scaler.querySelectorAll('.deck-card');
      for(var i=0;i<cards.length;i++){
        var ci = parseInt(cards[i].getAttribute('data-ci'), 10);
        positionCard(cards[i], ci);
      }
    }
    function fitRing(){
      if(!deckEl || deckEl.clientWidth <= 0) return;
      var s = deckEl.clientWidth / 1000;
      deckEl.style.setProperty('--ring-scale', s);
    }
    function queueAngle(d){
      pendingDelta += d;
      if(rafPending) return;
      rafPending = true;
      requestAnimationFrame(function(){
        ringAngle += pendingDelta; pendingDelta = 0; rafPending = false;
        layoutRing();
      });
    }

    function updateRingCore(){
      var cc = deckEl.querySelector('.ring-core .core-count');
      if(cc) cc.textContent = selected.length + ' / ' + target;
    }

    function renderDeck(){
      deckEl.className = 'deck-ring';
      deckEl.style.display = '';
      deckEl.classList.remove('completing','collapsed');
      deckEl.innerHTML = '';
      deckEl.classList.toggle('full', selected.length >= target);

      scaler = document.createElement('div'); scaler.className = 'ring-scaler';
      core = document.createElement('div'); core.className = 'ring-core';
      core.innerHTML = '<div class="core-count">0 / ' + target + '</div><div class="core-label">已选</div>';
      deckEl.appendChild(scaler);
      deckEl.appendChild(core);

      var N = deckOrder.length;
      deckOrder.forEach(function(ci, pos){
        var card = DATA.cards[ci];
        var base = (360 / N) * pos - 90;   // -90 让第 0 张自正上方开始
        baseAngles[ci] = base;

        var el = document.createElement('div');
        el.className = 'deck-card on-ring dealing';
        el.setAttribute('role','button');
        el.setAttribute('tabindex','0');
        el.setAttribute('data-ci', String(ci));
        el.setAttribute('aria-label','卡牌 ' + (ci+1) + ' ' + (card.name || '') + '（点击选取）');
        el.setAttribute('aria-pressed','false');

        var inner = document.createElement('div'); inner.className = 'flip-inner';
        var fd = document.createElement('div'); fd.className = 'face face-down';
        var b = document.createElement('img'); b.src = DATA.back; b.alt = '卡背';
        fd.appendChild(b);
        var fu = document.createElement('div'); fu.className = 'face face-up';
        var f = buildFront(card);
        fu.appendChild(f);
        inner.appendChild(fd); inner.appendChild(fu);

        var badge = document.createElement('span'); badge.className = 'pick-badge'; badge.hidden = true;
        el.appendChild(inner); el.appendChild(badge);

        el.style.left = RING_CENTER + 'px';
        el.style.top  = RING_CENTER + 'px';
        el.style.animationDelay = (pos * 5) + 'ms';

        (function(ci, el, fu, f){
          el.addEventListener('click', function(e){
            if(Date.now() < suppressClickUntil){ e.preventDefault(); return; }
            toggle(ci, el, fu, f);
          });
          el.addEventListener('keydown', function(e){
            if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(ci, el, fu, f); }
          });
        })(ci, el, fu, f);

        scaler.appendChild(el);
        positionCard(el, ci);
      });

      fitRing();
      updateRingCore();
    }

    function renumberBadges(){
      selected.forEach(function(ci, i){
        var el = scaler.querySelector('.deck-card[data-ci="' + ci + '"]');
        if(!el) return;
        var b = el.querySelector('.pick-badge');
        if(b){ b.textContent = String(i + 1); }
      });
    }

    function toggle(ci, el, fu, fimg){
      var idx = selected.indexOf(ci);
      if(idx > -1){
        selected.splice(idx, 1);
        delete reversedMap[ci];
        el.classList.remove('flipped','chosen');
        el.setAttribute('aria-pressed','false');
        var ob = el.querySelector('.pick-badge'); if(ob) ob.hidden = true;
        renumberBadges();
      } else {
        if(selected.length >= target){
          if(deckHint) deckHint.textContent = '已选满 ' + target + ' 张。点击已选中的卡可取消或更换。';
          return;
        }
        selected.push(ci);
        var deck = cur();
        reversedMap[ci] = (deck.allowReverse && revChk && revChk.checked) ? (Math.random() < 0.5) : false;
        if(DATA.cards[ci].art && fimg && fimg.tagName === 'IMG' && !fimg.getAttribute('src')){
          fimg.src = DATA.cards[ci].img;
        }
        fu.classList.toggle('rev', !!reversedMap[ci]);
        el.classList.add('flipped','chosen');
        el.setAttribute('aria-pressed','true');
        var nb = el.querySelector('.pick-badge');
        if(nb){ nb.textContent = String(selected.length); nb.hidden = false; }
      }
      updateCounter();
      updateRingCore();
      if(selected.length === target){ flyToCenter(); }
      else {
        if(actionsEl) actionsEl.hidden = true;
        clearPremium();
        clearCeltic();
      }
    }

    function flyToCenter(){
      deckEl.classList.add('completing');
      if(core) core.classList.add('done');
      var cards = scaler.querySelectorAll('.deck-card');
      for(var i=0;i<cards.length;i++){
        var el = cards[i];
        if(el.classList.contains('chosen')){
          el.style.transform = 'translate(-50%,-50%) scale(.16)';
          el.style.opacity = '0';
          el.style.zIndex = '40';
        } else {
          el.style.opacity = '0';
        }
      }
      renderReading(false);   // 同步显示牌阵（选满即展开），逐张揭示
      setTimeout(function(){
        if(deckEl.classList.contains('completing')){
          deckEl.classList.add('collapsed');
          deckEl.style.display = 'none';
        }
      }, 760);
    }

    function updateCounter(){
      counterEl.textContent = '已选 ' + selected.length + ' / ' + target;
      deckEl.classList.toggle('full', selected.length >= target);
    }

    function clearCeltic(){ var o = document.querySelector('.celtic-cross-wrap'); if(o) o.remove(); }
    function clearPremium(){ var pz = document.getElementById('premiumZone'); if(pz) pz.hidden = true; }

    // 组合牌义内容（公开 + GitHub + 问题导向），供右栏「牌义」区块复用
    function buildMeaningContent(card, rev){
      var deck = cur();
      var meaningEl = document.createElement('div'); meaningEl.className = 'slot-meaning';
      var meaningText = rev ? (card.reversed || card.meaning || '') : (card.meaning || '');
      var detailText = card.detail || '';
      var pubWrap = document.createElement('div'); pubWrap.className = 'exp-block exp-public';
      pubWrap.innerHTML = '<div class="exp-label">公开解释</div>';
      var pubBody = document.createElement('div'); pubBody.className = 'exp-body';
      pubBody.innerHTML = '<div class="sm-keyword">' + escapeHtml(meaningText) + '</div>'
        + (detailText ? '<div class="sm-detail">' + escapeHtml(detailText) + '</div>' : '');
      pubWrap.appendChild(pubBody);
      meaningEl.appendChild(pubWrap);

      var en = deck.enrich ? deck.enrich(card) : null;
      if(en){
        var ghWrap = document.createElement('div'); ghWrap.className = 'exp-block exp-github';
        ghWrap.innerHTML = '<div class="exp-label">GitHub 解释</div>';
        var ghBody = document.createElement('div'); ghBody.className = 'exp-body exp-github-body';
        var seLines = [];
        seLines.push('<div class="se-line se-en">' + escapeHtml(rev ? en.reversed : en.upright) + '</div>');
        if(en.love)   seLines.push('<div class="se-line"><span class="se-k">爱情</span><span class="se-v">' + escapeHtml(en.love) + '</span></div>');
        if(en.career) seLines.push('<div class="se-line"><span class="se-k">事业</span><span class="se-v">' + escapeHtml(en.career) + '</span></div>');
        if(en.keywords && en.keywords.length) seLines.push('<div class="se-line se-kw">' + en.keywords.map(escapeHtml).join(' · ') + '</div>');
        ghBody.innerHTML = seLines.join('');
        ghWrap.appendChild(ghBody);
        meaningEl.appendChild(ghWrap);
      }

      var qInfo = currentQuestion();
      var qBlock = buildQuestionBlock(card, rev, qInfo.cat, qInfo.display);
      if(qBlock) meaningEl.appendChild(qBlock);
      return meaningEl;
    }

    // 左栏：卡牌视觉（卡面 + 位置 / 名称 / 逆位标记）
    function buildCardVisual(ci, label){
      var deck = cur();
      var card = DATA.cards[ci];
      var rev = !!reversedMap[ci];
      var slot = document.createElement('div'); slot.className = 'slot';
      var rc = document.createElement('div'); rc.className = 'read-card' + (rev ? ' rev' : '');

      if(card.art || (card.img && card.img.length > 0)){
        var im = document.createElement('img'); im.loading = 'lazy'; im.decoding = 'async';
        im.alt = (card.name || '卡牌') + (rev ? ' 逆位' : ' 正面');
        im.src = card.img;
        var setAR = function(){ if(im.naturalWidth && im.naturalHeight){ rc.style.aspectRatio = (im.naturalWidth/im.naturalHeight).toFixed(4); } };
        if(im.complete){ setAR(); }
        im.addEventListener('load', setAR);
        rc.appendChild(im);
      } else {
        var ph = document.createElement('div'); ph.className = 'ph-card';
        ph.innerHTML = '<div class="ph-name"></div><div class="ph-tag">图像生成中</div>';
        ph.querySelector('.ph-name').textContent = (card.nameCn || '') + ' ' + (card.name || '');
        rc.appendChild(ph);
        rc.style.aspectRatio = '2 / 3';
      }

      var cap = document.createElement('div'); cap.className = 'slot-caption';
      cap.innerHTML = '<div class="slot-label"></div><div class="slot-name"></div><div class="slot-rev"></div>';
      cap.querySelector('.slot-label').textContent = label;
      cap.querySelector('.slot-name').textContent = (card.nameCn || card.name || '—') + (card.name ? ' · ' + card.name : '');
      cap.querySelector('.slot-rev').textContent = rev ? 'REVERSED · 逆位' : '';

      slot.appendChild(rc); slot.appendChild(cap);
      return slot;
    }

    // 右栏：牌义区块（位置 + 名称 抬头 + 组合牌义）
    function buildMeaningBlock(ci, label){
      var card = DATA.cards[ci];
      var rev = !!reversedMap[ci];
      var block = document.createElement('div'); block.className = 'read-meaning';
      var h = document.createElement('div'); h.className = 'rm-head';
      h.innerHTML = '<span class="rm-pos"></span><span class="rm-name"></span>';
      h.querySelector('.rm-pos').textContent = label;
      h.querySelector('.rm-name').textContent = (card.nameCn || card.name || '—') + (card.name ? ' · ' + card.name : '') + (rev ? ' · 逆位' : '');
      block.appendChild(h);
      block.appendChild(buildMeaningContent(card, rev));
      return block;
    }

    // 取得当前提问：领域 key + 选中的常见问题文字 + 自由输入文字
    function currentQuestion(){
      var cat = questionSelEl ? (questionSelEl.value || '') : '';
      var text = '';
      if(cat && questionSelEl && questionSelEl.selectedIndex >= 0){
        text = questionSelEl.options[questionSelEl.selectedIndex].textContent.trim();
      }
      var free = (questionEl && questionEl.value || '').trim();
      return { cat: cat, text: text, free: free, display: text || free };
    }

    function updateReadingQuestion(qLabel, q){
      var rq = document.getElementById('readingQuestion');
      if(!rq) return;
      if(qLabel || q){
        rq.textContent = '你的提问' + (qLabel ? '（' + qLabel + '）' : '') + (q ? '：' + q : '');
        rq.hidden = false;
      } else {
        rq.hidden = true;
      }
    }

    function buildQuestionBlock(card, rev, qCat, qText){
      var ctx = qCat ? QUESTION_CONTEXTS[qCat] : null;
      if(!ctx && !qText) return null;
      var meaningText = rev ? (card.reversed || card.meaning || '') : (card.meaning || '');
      if(!meaningText) return null;
      var wrap = document.createElement('div'); wrap.className = 'exp-block exp-question';
      var label = '问题导向解读' + (ctx ? ' · ' + ctx.label : '');
      wrap.innerHTML = '<div class="exp-label">' + escapeHtml(label) + '</div>';
      var body = document.createElement('div'); body.className = 'exp-body';
      var leadHtml;
      if(ctx){
        leadHtml = (qText ? '针对「' + escapeHtml(qText) + '」，' : '') + escapeHtml(rev ? ctx.revLead : ctx.lead);
      } else {
        leadHtml = '针对「' + escapeHtml(qText) + '」，这张牌';
      }
      body.innerHTML = '<div class="q-lead">' + leadHtml + '</div>'
        + '<div class="q-body">' + escapeHtml(meaningText) + '</div>';
      wrap.appendChild(body);
      return wrap;
    }

    // 以「常见问题」填充提问下拉（若清单已载入）
    function populateQuestionSel(){
      if(!questionSelEl) return;
      var list = window.COMMON_QUESTIONS;
      if(!list || !list.length) return;
      var html = '<option value="">— 选择常见问题（选填）—</option>';
      list.forEach(function(g){
        html += '<optgroup label="' + escapeHtml(g.group) + '">';
        (g.items || []).forEach(function(q){
          html += '<option value="' + g.key + '">' + escapeHtml(q) + '</option>';
        });
        html += '</optgroup>';
      });
      questionSelEl.innerHTML = html;
    }

    function renderReading(instant){
      var deck = cur();
      var labels = deck.labels[target] || [];
      var qInfo = currentQuestion();
      var qLabel = qInfo.cat ? (QUESTION_CONTEXTS[qInfo.cat] ? QUESTION_CONTEXTS[qInfo.cat].label : qInfo.cat) : '';
      updateReadingQuestion(qLabel, qInfo.display);
      var cardsCol = document.getElementById('readingCards');
      var textCol = document.getElementById('readingText');
      if(!cardsCol || !textCol) return;
      cardsCol.innerHTML = '';
      textCol.innerHTML = '';
      clearCeltic();

      if(deck.celtic && target === 10){
        var wrap = document.createElement('div'); wrap.className = 'celtic-cross-wrap';
        var cross = document.createElement('div'); cross.className = 'celtic-cross';
        var staff = document.createElement('div'); staff.className = 'celtic-staff';
        selected.forEach(function(ci, i){
          var slot = buildCardVisual(ci, labels[i] || ('No.' + (i+1)));
          if(i < 6){ cross.appendChild(slot); } else { staff.appendChild(slot); }
        });
        wrap.appendChild(cross); wrap.appendChild(staff);
        cardsCol.appendChild(wrap);
      } else {
        var grid = document.createElement('div'); grid.className = 'cards-grid';
        grid.setAttribute('data-count', String(selected.length));
        selected.forEach(function(ci, i){
          grid.appendChild(buildCardVisual(ci, labels[i] || ('No.' + (i+1))));
        });
        cardsCol.appendChild(grid);
      }

      // 右栏：与左栏卡牌一一对应的牌义
      selected.forEach(function(ci, i){
        textCol.appendChild(buildMeaningBlock(ci, labels[i] || ('No.' + (i+1))));
      });

      // 整体淡入（占星猫桌布淡出后，牌张与牌义渐次浮现）
      var split = document.querySelector('.reading-split');
      if(split){ split.classList.remove('in'); void split.offsetWidth; split.classList.add('in'); }

      var revCount = selected.filter(function(c){ return reversedMap[c]; }).length;
      metaNote.textContent = '牌组共 ' + DATA.total + ' 张 · 你选出 ' + selected.length + ' 张'
        + (revCount ? '（其中 ' + revCount + ' 张逆位）' : '')
        + ((qLabel || qInfo.display) ? ' · 提问：' + (qLabel ? qLabel + (qInfo.display ? '（' + qInfo.display + '）' : '') : qInfo.display) : '');

      if(instant){
        var allS = cardsCol.querySelectorAll('.slot');
        var allM = textCol.querySelectorAll('.read-meaning');
        for(var si=0; si<allS.length; si++){ allS[si].classList.add('show'); }
        for(var mi=0; mi<allM.length; mi++){ allM[mi].classList.add('show'); }
        actionsEl.hidden = false;
        if(deck.premium) renderPremium();
      } else {
        actionsEl.hidden = true;
        if(deckHint) deckHint.textContent = '正在依次翻开牌阵…';
        dealSequence();
      }
    }

    // 逐张揭示：抽牌改为一张张翻开，让用户看清「位置 ↔ 牌义」的对应关系
    var DEAL_MS = 760;
    var dealTimers = [];
    function clearDealTimers(){ for(var i=0;i<dealTimers.length;i++){ clearTimeout(dealTimers[i]); } dealTimers = []; }
    function dealSequence(){
      clearDealTimers();
      var cardsCol = document.getElementById('readingCards');
      var textCol = document.getElementById('readingText');
      if(!cardsCol || !textCol){ finishDeal(); return; }
      var slots = cardsCol.querySelectorAll('.slot');
      var means = textCol.querySelectorAll('.read-meaning');
      var n = Math.min(selected.length, slots.length);
      if(n === 0){ finishDeal(); return; }
      for(var i=0;i<n;i++){
        (function(i){
          var t = setTimeout(function(){
            if(slots[i]) slots[i].classList.add('show');
            if(means[i]) means[i].classList.add('show');
            if(deckHint){
              var lab = (slots[i] && slots[i].querySelector('.slot-label')) ? slots[i].querySelector('.slot-label').textContent : '';
              deckHint.textContent = (i+1) + ' / ' + n + ' · 翻开：' + lab;
            }
            if(i === n-1) finishDeal();
          }, 420 + i*DEAL_MS);
          dealTimers.push(t);
        })(i);
      }
    }
    function finishDeal(){
      if(actionsEl) actionsEl.hidden = false;
      if(deckHint) deckHint.textContent = '';
      if(cur().premium) renderPremium();
    }

    function renderPremium(){
      // 合规：本平台为个人备案的非经营性网站，不提供有偿服务。
      // 原付费引导卡片已移除；全站仅保留页脚的
      // 非商业内容交流入口，功能结果页不出现任何价格或服务引导。
    }

    // 自动发牌：先让用户看见「杂乱洗牌」过程，洗完后占星猫桌布慢慢淡出，随后牌张渐次浮现
    function shuffle(){
      selected = [];
      reversedMap = {};
      ringAngle = 0;
      buildDeckOrder();
      var deck = cur();
      var picks = deckOrder.slice(0, target);
      picks.forEach(function(ci){
        selected.push(ci);
        reversedMap[ci] = (deck.allowReverse && revChk && revChk.checked) ? (Math.random() < 0.5) : false;
      });
      if(deckEl){ deckEl.classList.add('collapsed'); deckEl.style.display = 'none'; }
      actionsEl.hidden = true;
      clearPremium();
      clearCeltic();
      // 确保占星猫舞台可见，洗牌动画在其上演出
      if(tcMount){ tcMount.style.display = ''; tcMount.style.transition = ''; tcMount.style.opacity = '1'; }
      if(counterEl) counterEl.textContent = '';
      if(deckHint) deckHint.textContent = '正在洗牌——牌堆被打散、重排……';

      // 洗牌结束后的揭示：占星猫桌布缓缓淡出，牌张与牌义渐次浮现
      function reveal(){
        if(deckHint) deckHint.textContent = '';
        if(tcMount){
          tcMount.style.transition = 'opacity .8s ease';
          tcMount.style.opacity = '0';
          setTimeout(function(){ if(tcMount) tcMount.style.display = 'none'; }, 840);
        }
        renderReading(false);
        var rsec = document.getElementById('reading');
        if(rsec && rsec.scrollIntoView) rsec.scrollIntoView({ behavior:'smooth', block:'start' });
      }

      if(tc && tc.playShuffle){ tc.playShuffle(reveal); }
      else { reveal(); }
    }

    function buildSpreadTabs(){
      if(!spreadTabsEl) return;
      spreadTabsEl.innerHTML = '';
      cur().spreads.forEach(function(sp){
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role','tab');
        b.setAttribute('data-count', String(sp.count));
        b.textContent = sp.label;
        if(sp.count === target){ b.classList.add('active'); b.setAttribute('aria-selected','true'); }
        else { b.setAttribute('aria-selected','false'); }
        b.addEventListener('click', function(){
          spreadTabsEl.querySelectorAll('button').forEach(function(x){
            x.classList.remove('active'); x.setAttribute('aria-selected','false');
          });
          b.classList.add('active'); b.setAttribute('aria-selected','true');
          target = sp.count;
          shuffle();
        });
        spreadTabsEl.appendChild(b);
      });
      if(revWrap) revWrap.style.display = cur().allowReverse ? '' : 'none';
    }

    function updateHero(){
      var deck = cur();
      if(heroKicker) heroKicker.textContent = deck.kicker;
      if(heroTitle)  heroTitle.textContent  = deck.title;
      if(heroLead)   heroLead.textContent   = deck.lead;
      if(bcTail)     bcTail.textContent      = deck.title;
    }

    function switchToDeck(i){
      i = ((i % valid.length) + valid.length) % valid.length;
      if(i === activeIdx) return;
      activeIdx = i;
      DATA = cur().data;
      target = cur().defaultCount || 1;
      updateHero();
      buildSpreadTabs();
      if(tc) tc.setDeckLabel(cur().title);
      shuffle();
      updateDeckSwitch();
    }
    function switchDeck(dir){ switchToDeck(activeIdx + dir); }
    function updateDeckSwitch(){
      if(!deckSwitchEl) return;
      var btns = deckSwitchEl.querySelectorAll('button[data-deck]');
      for(var i=0;i<btns.length;i++){
        var on = (btns[i].getAttribute('data-deck') === cur().key);
        btns[i].classList.toggle('active', on);
        btns[i].setAttribute('aria-selected', on ? 'true' : 'false');
      }
    }

    // ---- 圆环旋转手势（拖曳 / 触控） ----
    function center(){
      var r = deckEl.getBoundingClientRect();
      return { x: r.left + r.width/2, y: r.top + r.height/2 };
    }
    function angleAt(x, y){
      var c = center();
      return Math.atan2(y - c.y, x - c.x) * 180 / Math.PI;
    }
    function onDown(e){
      if(deckEl.classList.contains('completing')) return;
      if(e.target && e.target.closest && e.target.closest('.ring-core')) return;
      dragging = true; dragMoved = false;
      lastAngle = angleAt(e.clientX, e.clientY);
      startX = e.clientX; startY = e.clientY;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    }
    function onMove(e){
      if(!dragging) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if(dx*dx + dy*dy > 36) dragMoved = true;
      var a = angleAt(e.clientX, e.clientY);
      var d = a - lastAngle;
      if(d > 180) d -= 360;
      if(d < -180) d += 360;
      lastAngle = a;
      queueAngle(d);
    }
    function onUp(){
      if(!dragging) return;
      dragging = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if(dragMoved){ suppressClickUntil = Date.now() + 350; }
    }

    function shuffleWithFx(){ shuffle(); }
    if(shuffleBtn) shuffleBtn.addEventListener('click', shuffleWithFx);
    if(redoBtn)    redoBtn.addEventListener('click', shuffleWithFx);
    if(revChk){
      revChk.addEventListener('change', function(){
        if(revToggle) revToggle.classList.toggle('on', revChk.checked);
      });
    }
    // 改变提问领域 / 补充文字时，若已出结果则即时重算「问题导向解读」
    function rerenderIfReading(){
      var shown = !!document.getElementById('readingCards') && document.getElementById('readingCards').children.length > 0;
      if(shown) renderReading(true);
    }
    if(questionSelEl) questionSelEl.addEventListener('change', rerenderIfReading);
    if(questionEl) questionEl.addEventListener('change', rerenderIfReading);
    // 轮盘选牌已停用，移除拖曳旋转手势
    if(window.addEventListener){
      var rT = null;
      window.addEventListener('resize', function(){
        if(rT) clearTimeout(rT);
        rT = setTimeout(fitRing, 120);
      });
    }

    // 桌布（占星猫）互动
    if(tcMount && window.Tablecloth && window.Tablecloth.create){
      tc = window.Tablecloth.create({
        root: tcMount,
        gestureRoot: tcMount,
        onShuffle: shuffle,
        onSwitch: switchDeck,
        onSwitchTo: function(i){ switchToDeck(i); },
        decks: valid.map(function(d){ return d.title; }),
        getActive: function(){ return activeIdx; },
        getLabel: function(){ return cur().title; }
      });
    }

    // 牌种切换 UI（页面若提供 #deckSwitch 容器则自动生成）
    if(deckSwitchEl){
      deckSwitchEl.innerHTML = '';
      valid.forEach(function(d, i){
        var b = document.createElement('button');
        b.type = 'button'; b.setAttribute('role', 'tab');
        b.setAttribute('data-deck', d.key); b.textContent = d.title;
        b.setAttribute('aria-selected', 'false');
        b.addEventListener('click', function(){ switchToDeck(i); });
        deckSwitchEl.appendChild(b);
      });
      updateDeckSwitch();
    }

    // 初始化
    populateQuestionSel();
    updateHero();
    buildSpreadTabs();
    buildDeckOrder();
    if(deckEl){ deckEl.classList.add('collapsed'); deckEl.style.display = 'none'; }  // 轮盘选牌区已停用
    if(counterEl) counterEl.textContent = '';
    if(deckHint) deckHint.textContent = '点击上方桌布中央，或下方「洗牌」按钮，自动为你抽牌。';
    // 对外 API：供 share.js / div-nav.js 使用（置于 init 作用域内，方能存取 cur/valid/selected 等）
    DivTool.getState = function(){
      var qi = currentQuestion();
      return {
        deck: cur().key,
        count: target,
        question: (questionEl && questionEl.value || '').trim(),
        qCat: (questionSelEl ? questionSelEl.value : '') || '',
        qSel: qi.text || '',
        picks: selected.map(function(ci){
          var c = DATA.cards[ci];
          return { n: c.name, r: !!reversedMap[ci] };
        })
      };
    };
    DivTool.redo = function(){ if(typeof shuffle === 'function') shuffle(); };
    DivTool.switchTo = function(key){
      for(var i=0;i<valid.length;i++){ if(valid[i].key === key){ switchToDeck(i); return true; } }
      return false;
    };
    DivTool.otherDeckKey = function(){
      for(var i=0;i<valid.length;i++){ if(valid[i].key !== cur().key) return valid[i].key; }
      return null;
    };
    DivTool.restore = function(state){
      if(!state || !state.deck) return false;
      var di = -1;
      for(var i=0;i<valid.length;i++){ if(valid[i].key === state.deck){ di = i; break; } }
      if(di < 0) return false;
      switchToDeck(di);
      target = state.count || cur().defaultCount || 1;
      selected = []; reversedMap = {};
      (state.picks || []).forEach(function(p){
        var ci = -1;
        for(var j=0;j<DATA.cards.length;j++){ if(DATA.cards[j].name === p.n){ ci = j; break; } }
        if(ci < 0) return;
        selected.push(ci); reversedMap[ci] = !!p.r;
      });
      if(questionSelEl && state.qCat) questionSelEl.value = state.qCat;
      if(questionSelEl && state.qSel){
        for(var k=0;k<questionSelEl.options.length;k++){
          if(questionSelEl.options[k].textContent.trim() === state.qSel){ questionSelEl.selectedIndex = k; break; }
        }
      }
      if(questionEl && state.question) questionEl.value = state.question;
      deckEl.classList.add('completing','collapsed');
      deckEl.style.display = 'none';
      if(tcMount){ tcMount.style.transition = ''; tcMount.style.opacity = '0'; tcMount.style.display = 'none'; }
      renderReading(true);
      var rsec = document.getElementById('reading');
      if(rsec && rsec.scrollIntoView){ rsec.scrollIntoView({behavior:'smooth'}); }
      return true;
    };
  };

  window.DivTool = DivTool;
  })();
