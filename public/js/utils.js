/* ══════════════════════════════════════════════
   OrangeLibrary — 유틸리티 함수
   ══════════════════════════════════════════════ */

var $ = id => document.getElementById(id);

/* ── 다국어 번역 헬퍼 ── */
function t(ko, en) {
  return (window.LANG === 'en') ? en : ko;
}

/* ── 언어 전환 ── */
function switchLang() {
  var path = window.location.pathname;
  if (window.LANG === 'ko') {
    // 한국어 → 영어: /en/ 접두사 추가
    window.location.href = '/en' + (path === '/' ? '/' : path);
  } else {
    // 영어 → 한국어: /en/ 접두사 제거
    var koPath = path.replace(/^\/en/, '') || '/';
    window.location.href = koPath;
  }
}

/* ── 상단 네비 드롭다운 클릭 토글 ── */
function toggleNavDropdown(el, e) {
  if (e.target.closest('.nav-dropdown-menu') || e.target.closest('.nav-mega')) return;
  e.stopPropagation();
  var isOpen = el.classList.contains('open');
  document.querySelectorAll('.nav-dropdown.open').forEach(function(d){ if(d!==el) d.classList.remove('open'); });
  if (!isOpen) el.classList.add('open');
}
document.addEventListener('click', function() {
  document.querySelectorAll('.nav-dropdown.open').forEach(function(d){ d.classList.remove('open'); });
});

/**
 * HTML 이스케이프 — 텍스트/속성 양쪽 컨텍스트 모두 안전
 * 텍스트만 필요했던 기존 div.textContent 방식은 " ' 미처리로
 * 속성 인젝션 공격에 취약했기에 명시적 치환으로 변경.
 */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── 관리자 해시 비교 (이메일 평문 노출 방지) ── */
function _adminEmailHash(email) {
  var s = email.toLowerCase().trim();
  var h = 5381;
  for (var i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return h;
}

function isAdminEmail(email) {
  if (!email) return false;
  var hashes = (typeof CONFIG !== 'undefined' && CONFIG._adminHashes) ? CONFIG._adminHashes : [];
  var h = _adminEmailHash(email);
  return hashes.indexOf(h) !== -1;
}

/* ── URL 새니타이징 (javascript: 프로토콜 차단) ── */
function sanitizeUrl(url) {
  if (!url) return '';
  var s = String(url).trim();
  if (/^javascript:/i.test(s) || /^data:/i.test(s) || /^vbscript:/i.test(s)) return '';
  return s;
}

function showToast(msg, ms = 2500, delay = 0) {
  setTimeout(function() {
    let t = $('_toast');
    if (!t) {
      t = document.createElement('div');
      t.id = '_toast';
      t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(10px);background:linear-gradient(135deg,#C47A3E,#BF8C80);color:#fff;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;opacity:0;transition:all .25s;pointer-events:none;z-index:9999;white-space:nowrap;font-family:"Noto Sans KR",sans-serif;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(t._t);
    t._t = setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(10px)';
    }, ms);
  }, delay);
}

function pageInfo(txt) {
  const lines = txt.split('\n').length;
  const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
  const chars = txt.replace(/\s/g, '').length;
  // 원고지 매수: 공백 포함 기준 (문학 공모전·출판 투고 표준, 200자 원고지)
  const charsWithSpaces = txt.replace(/\n/g, '').length;
  const manuscript = Math.max(1, Math.round(charsWithSpaces / 200));
  const a4 = Math.max(1, Math.round(chars / 1800));
  return { lines, words, chars, manuscript, a4 };
}

// ── 방문 트래킹: 모든 페이지에서 analytics.js 자동 로드 ──
// (관리자/봇/로컬 제외는 analytics.js 내부에서 처리)
(function loadAnalytics() {
  if (typeof window === 'undefined') return;
  if (window.__OR_ANALYTICS_LOADED) return;
  window.__OR_ANALYTICS_LOADED = true;
  var p = window.location.pathname;
  if (/^\/admin(\/|$)/.test(p) || /^\/blog\/admin(\/|$)/.test(p)) return;
  var s = document.createElement('script');
  s.src = '/js/analytics.js?v=20260509a';
  s.async = true;
  (document.head || document.documentElement).appendChild(s);
})();
