/**
 * Premium Content Lock Module
 * 公共领域内容免费开放，仅保留深度解读牌面付费服务
 *
 * 通道：微信客服（单次付费）
 *
 * 合规声明：服务定位为"文化研究"与"心理探索参考"
 * 遵循《互联网信息服务管理办法》相关要求。
 */
(function (global) {
  'use strict';

  // ===== Config =====
  var CONFIG = {
    // 微信客服
    wechatId: 'uponstar_wx',
    wechatQrImage: '', // 放置微信二维码图片路径，如 './assets/wechat-qr.png'

    // 免责声明
    disclaimer: '本站所有占卜内容均为文化研究与心理探索参考，不构成任何决策依据。',

    // 唯一服务：深度解读牌面
    service: {
      id: 'deep-reading',
      name: '深度解读牌面',
      desc: '由专业解读师根据卦象/牌面提供一对一深度分析，结合东方易理与西方神秘学，为您呈现个性化解读',
      price: '88',
      unit: '次',
      icon: '✦'
    }
  };

  // ===== CSS injection =====
  var CSS = `
/* ===== PREMIUM LOCK ===== */
.premium-lock {
  position: relative;
  margin-top: 24px;
  border-radius: var(--radius-card, 10px);
  overflow: hidden;
}

/* Locked content wrapper */
.premium-content-locked {
  position: relative;
  max-height: 180px;
  overflow: hidden;
  filter: blur(4px);
  opacity: 0.5;
  user-select: none;
  pointer-events: none;
}

/* Gradient fade overlay */
.premium-lock-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 30%,
    rgba(8, 8, 14, 0.85) 65%,
    var(--surface, #0c0c14) 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 24px 20px 28px;
  gap: 14px;
}

/* Lock badge */
.premium-lock-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid rgba(200, 164, 92, 0.3);
  background: rgba(200, 164, 92, 0.06);
  color: #e0c078;
  font: 500 11px 'Outfit', 'PingFang SC', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  white-space: nowrap;
}

.premium-lock-badge svg {
  width: 12px;
  height: 12px;
  fill: currentColor;
  opacity: 0.8;
}

/* WeChat unlock button */
.premium-unlock-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 36px;
  border-radius: 999px;
  border: 1px solid rgba(80, 160, 100, 0.4);
  background: linear-gradient(135deg, rgba(80, 160, 100, 0.1), rgba(80, 160, 100, 0.03));
  color: #6aad7a;
  font: 500 13px 'Outfit', 'PingFang SC', sans-serif;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.4s;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.premium-unlock-btn:hover {
  background: linear-gradient(135deg, rgba(80, 160, 100, 0.15), rgba(80, 160, 100, 0.05));
  box-shadow: 0 0 24px rgba(80, 160, 100, 0.1);
  transform: translateY(-1px);
}

.premium-unlock-btn:active {
  transform: translateY(0);
}

.premium-unlock-btn .lock-icon {
  width: 14px;
  height: 14px;
  fill: currentColor;
  opacity: 0.9;
  flex-shrink: 0;
}

/* Lock hint text */
.premium-lock-hint {
  font: 400 11px 'Outfit', 'PingFang SC', sans-serif;
  color: #605850;
  letter-spacing: 1px;
  text-align: center;
  max-width: 320px;
  line-height: 1.6;
}

/* ===== UNLOCKED STATE ===== */
.premium-lock.unlocked .premium-content-locked {
  filter: none;
  opacity: 1;
  max-height: none;
  user-select: text;
  pointer-events: auto;
}

.premium-lock.unlocked .premium-lock-overlay {
  display: none;
}

/* ===== FREE / PREMIUM SECTION LABELS ===== */
.section-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 4px;
  font: 500 10px 'Outfit', 'PingFang SC', sans-serif;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  vertical-align: middle;
  margin-left: 8px;
}

.section-tag.free {
  background: rgba(80, 160, 100, 0.1);
  border: 1px solid rgba(80, 160, 100, 0.2);
  color: #6aad7a;
}

.section-tag.premium {
  background: rgba(200, 164, 92, 0.1);
  border: 1px solid rgba(200, 164, 92, 0.25);
  color: #e0c078;
}

/* ===== WECHAT QR MODAL ===== */
.wechat-qr-modal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(4, 4, 8, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.wechat-qr-modal.active {
  display: flex;
}

.wechat-qr-card {
  background: linear-gradient(180deg, rgba(14, 12, 20, 0.95), rgba(8, 8, 14, 0.95));
  border: 1px solid rgba(200, 164, 92, 0.2);
  border-radius: 14px;
  padding: 32px 28px 24px;
  text-align: center;
  max-width: 320px;
  width: 90%;
  position: relative;
}

.wechat-qr-card .close-btn {
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  color: #605850;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  transition: color 0.3s;
}

.wechat-qr-card .close-btn:hover {
  color: #c8a45c;
}

.wechat-qr-card .qr-label {
  font: 400 11px 'Outfit', 'PingFang SC', sans-serif;
  color: #c8a45c;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.wechat-qr-card h4 {
  font: 400 18px 'Italiana', 'CrimsonPro', Georgia, serif;
  color: #f0ece4;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.wechat-qr-card .wx-id {
  font: 400 13px 'Outfit', monospace;
  color: #6aad7a;
  letter-spacing: 1px;
  margin-bottom: 18px;
  padding: 6px 16px;
  border-radius: 6px;
  background: rgba(80, 160, 100, 0.08);
  border: 1px solid rgba(80, 160, 100, 0.15);
  display: inline-block;
}

.wechat-qr-card .qr-img-wrap {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  border-radius: 10px;
  border: 1px solid rgba(200, 164, 92, 0.15);
  background: rgba(12, 12, 20, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.wechat-qr-card .qr-img-wrap img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
}

.wechat-qr-card .qr-placeholder {
  color: #605850;
  font: 400 12px 'Outfit', 'PingFang SC', sans-serif;
  line-height: 1.6;
  padding: 20px;
}

.wechat-qr-card .qr-note {
  font: 400 11px/1.6 'Outfit', 'PingFang SC', sans-serif;
  color: #605850;
  letter-spacing: 0.5px;
}

/* ===== CONSULTATION SECTION ===== */
.consultation-section {
  margin-top: 36px;
  padding: 32px 24px;
  border: 1px solid rgba(200, 164, 92, 0.15);
  border-radius: var(--radius-card, 10px);
  background: linear-gradient(180deg, rgba(14, 12, 20, 0.6), rgba(8, 8, 14, 0.4));
  position: relative;
  overflow: hidden;
}

.consultation-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200, 164, 92, 0.4), transparent);
}

.consultation-header {
  text-align: center;
  margin-bottom: 24px;
}

.consultation-header .label {
  font: 400 11px 'Outfit', 'PingFang SC', sans-serif;
  color: #c8a45c;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.consultation-header h3 {
  font: 400 22px 'Italiana', 'CrimsonPro', Georgia, serif;
  color: #f0ece4;
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.consultation-header .ornament {
  width: 80px;
  height: 1px;
  margin: 12px auto;
  background: linear-gradient(90deg, transparent, #8a7040, #c8a45c, #8a7040, transparent);
  opacity: 0.5;
}

.consultation-header .desc {
  font: 400 12px 'Outfit', 'PingFang SC', sans-serif;
  color: #a09888;
  letter-spacing: 1px;
  max-width: 360px;
  margin: 0 auto;
}

/* Single service card */
.consultation-card {
  padding: 24px 20px;
  border: 1px solid rgba(200, 164, 92, 0.2);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(200, 164, 92, 0.06), rgba(12, 12, 20, 0.5));
  text-align: center;
  max-width: 360px;
  margin: 0 auto 24px;
}

.consultation-card .svc-icon {
  font-size: 28px;
  color: #c8a45c;
  margin-bottom: 12px;
  display: block;
}

.consultation-card .svc-name {
  font: 500 15px 'Outfit', 'PingFang SC', sans-serif;
  color: #f0ece4;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.consultation-card .svc-desc {
  font: 400 12px 'Outfit', 'PingFang SC', sans-serif;
  color: #605850;
  line-height: 1.6;
  margin-bottom: 14px;
}

.consultation-card .svc-price {
  font: 400 28px 'Italiana', serif;
  color: #e0c078;
}

.consultation-card .svc-price .currency {
  font-size: 14px;
  opacity: 0.7;
  margin-right: 2px;
}

.consultation-card .svc-price .unit {
  font-size: 11px;
  color: #605850;
  margin-left: 4px;
  font-family: 'Outfit', sans-serif;
  letter-spacing: 1px;
}

/* CTA */
.consultation-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.cta-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 999px;
  font: 500 12px 'Outfit', 'PingFang SC', sans-serif;
  letter-spacing: 1.5px;
  cursor: pointer;
  transition: all 0.4s;
  text-decoration: none;
  border: 1px solid transparent;
}

.cta-btn.wechat {
  border-color: rgba(80, 160, 100, 0.35);
  background: rgba(80, 160, 100, 0.08);
  color: #6aad7a;
}

.cta-btn.wechat:hover {
  background: rgba(80, 160, 100, 0.12);
  box-shadow: 0 0 24px rgba(80, 160, 100, 0.08);
}

/* Disclaimer */
.premium-disclaimer {
  margin-top: 20px;
  padding: 14px 20px;
  border-radius: 6px;
  background: rgba(12, 12, 20, 0.4);
  border-left: 2px solid rgba(200, 164, 92, 0.2);
  font: 400 11px/1.7 'Outfit', 'PingFang SC', sans-serif;
  color: #605850;
  text-align: center;
  letter-spacing: 0.5px;
}

.premium-disclaimer .legal-links {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 12px;
}

.premium-disclaimer .legal-links a {
  color: #8a7040;
  text-decoration: none;
  font-size: 10px;
  letter-spacing: 0.5px;
  border-bottom: 1px dashed rgba(200, 164, 92, 0.15);
  transition: color 0.3s;
}

.premium-disclaimer .legal-links a:hover {
  color: #c8a45c;
  border-bottom-color: rgba(200, 164, 92, 0.4);
}

.premium-disclaimer .disclaimer-icon {
  display: inline-block;
  width: 12px;
  height: 12px;
  vertical-align: middle;
  margin-right: 4px;
  opacity: 0.6;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 600px) {
  .premium-unlock-btn {
    padding: 12px 28px;
    font-size: 11px;
    letter-spacing: 1px;
  }

  .consultation-section {
    padding: 24px 16px;
  }

  .consultation-header h3 {
    font-size: 18px;
  }

  .cta-row {
    flex-direction: column;
    width: 100%;
  }

  .cta-btn {
    width: 100%;
    justify-content: center;
  }
}
`;

  // ===== SVG Icons =====
  var ICONS = {
    lock: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 10V8a6 6 0 0112 0v2h1a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8a1 1 0 011-1h1zm2 0h8V8a4 4 0 00-8 0v2z" fill="currentColor"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/></svg>',
    wechat: '<svg viewBox="0 0 24 24" fill="none"><path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.5c.96.24 1.96.37 3 .37.26 0 .51-.01.77-.03C10.1 14.97 10 14.49 10 14c0-3.31 3.13-6 7-6 .34 0 .67.03 1 .07C17.45 5.7 13.85 4 9.5 4zM7 8.5a1 1 0 110 2 1 1 0 010-2zm5 0a1 1 0 110 2 1 1 0 010-2zm5 1.5c-3.31 0-6 2.24-6 5s2.69 5 6 5c.83 0 1.62-.14 2.36-.39L21.5 21l-.5-2.5C22.53 17.5 23 15.8 23 14c0-2.76-2.69-5-6-5zm-2 3a1 1 0 110 2 1 1 0 010-2zm4 0a1 1 0 110 2 1 1 0 010-2z" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>'
  };

  // ===== Inject CSS once =====
  var cssInjected = false;
  function injectCSS() {
    if (cssInjected) return;
    var style = document.createElement('style');
    style.setAttribute('data-premium-lock', '');
    style.textContent = CSS;
    document.head.appendChild(style);
    cssInjected = true;

    // Also inject WeChat QR modal (once)
    if (!document.getElementById('wechatQrModal')) {
      var modal = document.createElement('div');
      modal.id = 'wechatQrModal';
      modal.className = 'wechat-qr-modal';
      var qrContent = CONFIG.wechatQrImage
        ? '<div class="qr-img-wrap"><img src="' + CONFIG.wechatQrImage + '" alt="微信二维码"></div>'
        : '<div class="qr-img-wrap"><div class="qr-placeholder">请添加微信客服<br>获取深度解读服务</div></div>';
      modal.innerHTML =
        '<div class="wechat-qr-card">' +
          '<button class="close-btn" onclick="document.getElementById(\'wechatQrModal\').classList.remove(\'active\')">&times;</button>' +
          '<div class="qr-label">WeChat Service</div>' +
          '<h4>添加微信客服</h4>' +
          '<div class="wx-id">微信号：' + CONFIG.wechatId + '</div>' +
          qrContent +
          '<div class="qr-note">扫码或搜索微信号添加客服<br>告知所需解读类型即可预约</div>' +
        '</div>';
      modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.classList.remove('active');
      });
      document.body.appendChild(modal);
    }
  }

  // ===== Open WeChat QR modal =====
  function openWechatModal() {
    injectCSS();
    var modal = document.getElementById('wechatQrModal');
    if (modal) modal.classList.add('active');
  }

  // ===== Lock wrapper =====
  // 模糊覆盖 + 深度解读引导按钮
  function createLock(innerHTML, opts) {
    opts = opts || {};
    injectCSS();

    var wrapper = document.createElement('div');
    wrapper.className = 'premium-lock';

    // Locked content (blurred preview)
    var locked = document.createElement('div');
    locked.className = 'premium-content-locked';
    locked.innerHTML = innerHTML;
    wrapper.appendChild(locked);

    // Overlay with deep reading CTA
    var overlay = document.createElement('div');
    overlay.className = 'premium-lock-overlay';

    // Badge
    var badge = document.createElement('div');
    badge.className = 'premium-lock-badge';
    badge.innerHTML = ICONS.lock + '<span>深度解读</span>';
    overlay.appendChild(badge);

    // WeChat 客服 button
    var wxBtn = document.createElement('button');
    wxBtn.className = 'premium-unlock-btn';
    wxBtn.type = 'button';
    wxBtn.innerHTML = '<span class="lock-icon">' + ICONS.wechat + '</span>' +
      '<span>微信客服 获取深度解读</span>';
    wxBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openWechatModal();
    });
    overlay.appendChild(wxBtn);

    // Hint
    var hint = document.createElement('div');
    hint.className = 'premium-lock-hint';
    hint.textContent = opts.hint || '添加微信客服获取一对一深度解读，¥' + CONFIG.service.price + '/' + CONFIG.service.unit;
    overlay.appendChild(hint);

    wrapper.appendChild(overlay);

    return wrapper;
  }

  // ===== Lock specific sections by selector =====
  function lockSections(container, selectors, opts) {
    opts = opts || {};
    if (!container) return;

    selectors.forEach(function (sel) {
      var els = container.querySelectorAll(sel);
      els.forEach(function (el) {
        var previewHTML = el.innerHTML;
        el.innerHTML = '';
        el.appendChild(createLock(previewHTML, opts));
      });
    });
  }

  // ===== Create free section tag =====
  function createFreeTag() {
    injectCSS();
    var tag = document.createElement('span');
    tag.className = 'section-tag free';
    tag.textContent = '免费';
    return tag;
  }

  // ===== Create premium section tag =====
  function createPremiumTag() {
    injectCSS();
    var tag = document.createElement('span');
    tag.className = 'section-tag premium';
    tag.textContent = '深度';
    return tag;
  }

  // ===== Consultation section =====
  function createConsultation(opts) {
    opts = opts || {};
    injectCSS();

    var svc = CONFIG.service;

    var section = document.createElement('div');
    section.className = 'consultation-section';

    var header = '<div class="consultation-header">' +
      '<div class="label">Premium Service</div>' +
      '<h3>' + (opts.title || '深度解读牌面') + '</h3>' +
      '<div class="ornament"></div>' +
      '<div class="desc">' + (opts.desc || '由专业解读师一对一深度分析，结合卦象/牌面与东西方神秘学传统，为您提供个性化的文化探索指引。') + '</div>' +
    '</div>';

    var card = '<div class="consultation-card">' +
      '<span class="svc-icon">' + svc.icon + '</span>' +
      '<div class="svc-name">' + svc.name + '</div>' +
      '<div class="svc-desc">' + svc.desc + '</div>' +
      '<div class="svc-price"><span class="currency">¥</span>' + svc.price + '<span class="unit">/ ' + svc.unit + '</span></div>' +
    '</div>';

    var cta = '<div class="consultation-cta">' +
      '<div class="cta-row">' +
        '<button type="button" class="cta-btn wechat" onclick="PremiumLock.openWechat()">微信客服 预约解读</button>' +
      '</div>' +
    '</div>';

    var disclaimer = '<div class="premium-disclaimer">' +
      '<span class="disclaimer-icon">' + ICONS.info + '</span>' +
      '<span>' + CONFIG.disclaimer + '所有解读服务基于传统文化研究与心理探索，仅供文化参考。</span>' +
      '<div class="legal-links">' +
        '<a href="./terms.html" target="_blank">用户协议</a>' +
        '<a href="./privacy.html" target="_blank">隐私政策</a>' +
        '<a href="./refund.html" target="_blank">退款政策</a>' +
      '</div>' +
    '</div>';

    section.innerHTML = header + card + cta + disclaimer;
    return section;
  }

  // ===== Append consultation after a target element =====
  function appendConsultation(targetEl, opts) {
    if (!targetEl) return;
    var consultation = createConsultation(opts);
    targetEl.parentNode.insertBefore(consultation, targetEl.nextSibling);
  }

  // ===== Public API =====
  global.PremiumLock = {
    CONFIG: CONFIG,
    createLock: createLock,
    lockSections: lockSections,
    createConsultation: createConsultation,
    appendConsultation: appendConsultation,
    injectCSS: injectCSS,
    openWechat: openWechatModal,
    createFreeTag: createFreeTag,
    createPremiumTag: createPremiumTag
  };

})(window);