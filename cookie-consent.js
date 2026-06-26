/**
 * RGPD/GDPR Cookie Consent — André Carmo
 * Carrega o Google Analytics apenas após consentimento explícito.
 */
(function () {
  var GA_ID = 'G-FX2QGJ6GJ1';
  var STORAGE_KEY = 'ac_cookie_consent';

  function loadGA() {
    if (window._gaLoaded) return;
    window._gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function hideBar() {
    var bar = document.getElementById('cc-bar');
    if (bar) bar.remove();
  }

  function onAccept() {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    loadGA();
    hideBar();
  }

  function onReject() {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    hideBar();
  }

  function showBar() {
    var bar = document.createElement('div');
    bar.id = 'cc-bar';
    bar.innerHTML =
      '<div style="max-width:900px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">' +
        '<p style="margin:0;font-size:.88rem;line-height:1.5;color:#b3d9ff;">' +
          'Utilizamos cookies de análise (Google Analytics) para melhorar este site. ' +
          'Pode aceitar ou recusar o rastreamento. ' +
          '<a href="politica-privacidade.html" style="color:#00d4ff;text-decoration:underline;">Política de Privacidade & RGPD</a>.' +
        '</p>' +
        '<div style="display:flex;gap:.6rem;flex-shrink:0;">' +
          '<button id="cc-reject" style="padding:.55rem 1.2rem;border-radius:50px;border:1px solid #00d4ff;background:transparent;color:#00d4ff;font-size:.85rem;font-weight:600;cursor:pointer;">Recusar</button>' +
          '<button id="cc-accept" style="padding:.55rem 1.2rem;border-radius:50px;border:none;background:linear-gradient(135deg,#0066cc,#0080ff);color:#fff;font-size:.85rem;font-weight:600;cursor:pointer;">Aceitar</button>' +
        '</div>' +
      '</div>';
    bar.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;z-index:99999;' +
      'background:rgba(0,8,20,0.97);border-top:1px solid rgba(0,212,255,0.25);' +
      'padding:1rem 2rem;backdrop-filter:blur(10px);';
    document.body.appendChild(bar);
    document.getElementById('cc-accept').addEventListener('click', onAccept);
    document.getElementById('cc-reject').addEventListener('click', onReject);
  }

  function init() {
    var choice = localStorage.getItem(STORAGE_KEY);
    if (choice === 'accepted') {
      loadGA();
    } else if (!choice) {
      showBar();
    }
    // 'rejected' → nada carregado, sem banner
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
