/**
 * admin.js — OrangeLibrary 관리자 페이지 로직
 *
 * localStorage 기반 (Supabase 연결 시 서버 동기화)
 */

/* ── localStorage에서 Supabase 세션 직접 읽기 (getSession() hang 방지) ── */
function _getSupabaseSessionFromStorage() {
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1) {
        var raw = localStorage.getItem(k);
        if (raw) return JSON.parse(raw);
      }
    }
  } catch (e) {}
  return null;
}

/* ── 관리자 인증 (비밀번호 → 관리자 이메일로 Supabase 로그인) ── */
var _ADMIN_EMAIL = 'orange@orangelibrary.co.kr';

async function resetAdminPassword() {
  var err = document.getElementById('adminErr');
  if (err) { err.style.display = 'block'; err.textContent = '임시 비밀번호 생성 중...'; err.style.color = '#999'; }
  try {
    var res = await fetch('https://jolly-term-4055.orange-e65.workers.dev/auth/temp-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: _ADMIN_EMAIL })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || '요청 실패');
    if (err) {
      err.style.display = 'block';
      if (data.tempPw) {
        err.innerHTML = '<div style="margin-bottom:8px;color:#2E7D32;">임시 비밀번호가 생성되었습니다.</div>'
          + '<div style="background:#F2F2F2;border:2px solid #BF8C80;border-radius:8px;padding:12px;margin-bottom:8px;">'
          + '<span id="adminTempPw" style="font-size:16px;font-weight:800;letter-spacing:1px;color:#BF8C80;font-family:monospace;"></span></div>'
          + '<div style="color:#999;font-size:11px;">위 비밀번호로 로그인해주세요.</div>';
        document.getElementById('adminTempPw').textContent = data.tempPw;
      } else {
        err.textContent = '임시 비밀번호가 이메일로 발송되었습니다.';
        err.style.color = '#2E7D32';
      }
    }
  } catch (e) {
    if (err) { err.style.display = 'block'; err.textContent = e.message; err.style.color = '#B8612A'; }
  }
}

/* 비밀번호 로그인 (기존 방식 — Google OAuth 실패 시 fallback) */
async function adminAuth() {
  var err = document.getElementById('adminErr');
  var pwInput = document.getElementById('adminPw');
  var pw = pwInput ? pwInput.value : '';

  if (!pw) {
    if (err) { err.style.display = 'block'; err.textContent = '비밀번호를 입력하세요.'; err.style.color = '#B8612A'; }
    return;
  }

  if (err) { err.style.display = 'block'; err.textContent = '로그인 중...'; err.style.color = '#999'; }

  try {
    if (typeof supabase === 'undefined' || !supabase) throw new Error('Supabase 미초기화. 페이지를 새로고침해주세요.');
    var captchaToken = null;
    if (typeof hcaptcha !== 'undefined') {
      try { captchaToken = await hcaptcha.execute({ async: true }).then(function(r) { return r.response; }); } catch(ce) {}
    }
    var loginOpts = { email: _ADMIN_EMAIL, password: pw };
    if (captchaToken) loginOpts.options = { captchaToken: captchaToken };
    var res = await supabase.auth.signInWithPassword(loginOpts);
    if (res.error) throw new Error(res.error.message === 'Invalid login credentials' ? '비밀번호가 틀렸습니다.' : res.error.message);
    var user = res.data.user;
    if (!user || !user.email) throw new Error('로그인 실패');
    if (typeof isAdminEmail === 'function' && isAdminEmail(user.email)) {
      sessionStorage.setItem('tf_admin', 'ok');
      if (err) err.style.display = 'none';
      showAdmin();
    } else {
      await supabase.auth.signOut();
      throw new Error('관리자 권한이 없습니다.');
    }
  } catch (e) {
    if (err) { err.style.display = 'block'; err.textContent = e.message; err.style.color = '#B8612A'; }
  }
}

/* Google 로그인 — OrangeLibrary Worker로 보내 일반 사용자와 동일한 OAuth 흐름 사용 */
function googleLoginAdmin() {
  var WORKER = 'https://jolly-term-4055.orange-e65.workers.dev';
  window.location.href = WORKER + '/auth/google/login?returnTo=' + encodeURIComponent('/admin/');
}

/* 페이지 로드 시 자동 세션 체크 — admin 이메일이면 자동 진입, 아니면 로그인 화면 유지 */
async function checkAdminSession() {
  var err = document.getElementById('adminErr');
  try {
    // 1) localStorage 세션 우선 확인 (즉시 반응)
    var session = _getSupabaseSessionFromStorage();
    var user = session && session.user;
    if (user && user.email && typeof isAdminEmail === 'function' && isAdminEmail(user.email)) {
      sessionStorage.setItem('tf_admin', 'ok');
      if (err) err.style.display = 'none';
      showAdmin();
      return true;
    }
    // 2) Supabase getSession도 시도 (magic link 직후 세션 set이 늦을 수 있음)
    if (typeof supabase !== 'undefined' && supabase) {
      var res = await supabase.auth.getSession();
      var u2 = res && res.data && res.data.session && res.data.session.user;
      if (u2 && u2.email) {
        if (typeof isAdminEmail === 'function' && isAdminEmail(u2.email)) {
          sessionStorage.setItem('tf_admin', 'ok');
          if (err) err.style.display = 'none';
          showAdmin();
          return true;
        }
        // 로그인은 됐지만 admin이 아닌 경우 안내
        if (err) { err.style.display = 'block'; err.textContent = '관리자 권한이 없는 계정입니다.'; err.style.color = '#B8612A'; }
      }
    }
  } catch (e) { /* 무시 — 로그인 화면 그대로 표시 */ }
  return false;
}

/* URL 의 google_error 파라미터를 사용자에게 표시 (Google OAuth 실패 사유) */
function _showGoogleErrorFromUrl() {
  try {
    var params = new URLSearchParams(window.location.search);
    var ge = params.get('google_error');
    if (!ge) return;
    var msgs = {
      no_code: '구글 인증 코드를 받지 못했습니다.',
      invalid_state: '인증 상태(state)가 유효하지 않습니다.',
      csrf_failed: 'CSRF 검증에 실패했습니다. 쿠키 차단 여부를 확인해주세요.',
      token_failed: '구글 토큰 교환에 실패했습니다.',
      profile_failed: '구글 프로필 조회에 실패했습니다.',
      server_config: '서버 설정이 누락되었습니다.',
      create_user_failed: '신규 회원 생성에 실패했습니다.',
      link_failed: '로그인 링크 발급에 실패했습니다.',
      session_failed: '세션 생성에 실패했습니다. 다시 시도해주세요.',
      exception: '서버에서 예외가 발생했습니다.'
    };
    var err = document.getElementById('adminErr');
    if (err) {
      err.style.display = 'block';
      err.style.color = '#B8612A';
      err.textContent = (msgs[ge] || ('구글 로그인 오류: ' + ge));
    }
    // URL 정리(파라미터 제거) — 새로고침 시 메시지 누적 방지
    var clean = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', clean);
  } catch (e) { /* ignore */ }
}

/* 페이지 로드 직후 자동 체크 — magic link hash 파싱이 늦을 수 있어 폴링 + auth state 리스너 병행 */
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', function() {
    _showGoogleErrorFromUrl();

    // 1) 즉시 1회 + 늦게 들어오는 세션 대비 단계적 재시도
    var delays = [0, 200, 600, 1500, 3000];
    delays.forEach(function(ms) {
      setTimeout(function() {
        // 이미 패널이 보이면 스킵
        var wrap = document.getElementById('adminWrap');
        if (wrap && wrap.style.display === 'block') return;
        checkAdminSession();
      }, ms);
    });

    // 2) Supabase auth state 변경 시 즉시 재검증 (hash 파싱 직후 SIGNED_IN 발화)
    try {
      if (typeof supabase !== 'undefined' && supabase && supabase.auth && supabase.auth.onAuthStateChange) {
        supabase.auth.onAuthStateChange(function(event, session) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            checkAdminSession();
          }
        });
      }
    } catch (e) { /* ignore */ }
  });
}

function adminLogout() {
  sessionStorage.removeItem('tf_admin');
  document.getElementById('adminWrap').style.display = 'none';
  document.getElementById('adminLogin').style.display = 'flex';
  var _pwEl = document.getElementById('adminPw');
  if (_pwEl) _pwEl.value = '';
}

function showAdmin() {
  // sessionStorage 우회 방지: Supabase 세션 + 관리자 이메일 재검증
  var session = _getSupabaseSessionFromStorage();
  var user = session && session.user;
  if (!user || !user.email || typeof isAdminEmail !== 'function' || !isAdminEmail(user.email)) {
    sessionStorage.removeItem('tf_admin');
    var err = document.getElementById('adminErr');
    if (err) { err.style.display = 'block'; err.textContent = '관리자 인증에 실패했습니다. 다시 로그인해주세요.'; }
    return;
  }
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminWrap').style.display = 'block';
  renderDashboard();
}

/* ── 탭 전환 ── */
var TAB_TITLES = {
  dashboard: '대시보드', members: '회원 관리', inquiries: '고객 문의', spellcheck: '1:1 맞춤법 상담',
  reports: '맞춤법 제보',
  'spacing-exceptions': '교정 예외',
  demo: '데모체험 사용자',
  'review-board': '후기',
  points: '文 관리', notices: '공지사항', stats: '매출/통계', referrers: '유입 분석', content: '콘텐츠',
  authors: '작가 신청',
  payouts: '출간 정산',
  'publish-review': '출간 검토',
  publishing: '출판대행 검수'
};

function setAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(function(el) {
    el.classList.toggle('on', el.id === 'tab-' + tab);
  });
  document.querySelectorAll('.admin-nav-item').forEach(function(el) {
    el.classList.toggle('on', el.dataset.tab === tab);
  });
  document.getElementById('adminPageTitle').textContent = TAB_TITLES[tab] || tab;

  if (tab === 'dashboard') renderDashboard();
  else if (tab === 'members') renderMembers();
  else if (tab === 'inquiries') renderInquiries();
  else if (tab === 'spellcheck') loadSpellcheckList('pending');
  else if (tab === 'reports') loadReports();
  else if (tab === 'spacing-exceptions') loadSpacingExceptions();
  else if (tab === 'demo') loadDemoUsers();
  else if (tab === 'review-board') loadReviewBoard();
  else if (tab === 'points') renderPoints();
  else if (tab === 'notices') renderNotices();
  else if (tab === 'stats') renderStats();
  else if (tab === 'referrers') loadReferrerStats(1);
  else if (tab === 'content') renderContent();
  else if (tab === 'authors' && typeof loadAuthorApplications === 'function') loadAuthorApplications('all');
  else if (tab === 'payouts' && typeof initPayoutAdmin === 'function') initPayoutAdmin();
  else if (tab === 'publish-review' && typeof loadPendingPublishWorks === 'function') loadPendingPublishWorks();
  else if (tab === 'publishing' && typeof initPublishingAdmin === 'function') initPublishingAdmin({ skipGate: true });
}

/* ── 데이터 로드 헬퍼 ── */
var _supaMembers = [];  // Supabase에서 로드한 회원 캐시
var _WORKER_URL = 'https://jolly-term-4055.orange-e65.workers.dev';

function _getAdminToken() {
  var session = _getSupabaseSessionFromStorage();
  return (session && session.access_token) || '';
}

/** Supabase 세션 갱신 후 access_token 반환 (만료 토큰으로 403 나는 문제 방지) */
async function _getAdminTokenAsync() {
  try {
    if (typeof supabase !== 'undefined' && supabase && supabase.auth) {
      var res = await supabase.auth.getSession();
      var sess = res && res.data && res.data.session;
      if (sess && sess.access_token) return sess.access_token;
    }
  } catch (e) { /* localStorage 폴백 */ }
  return _getAdminToken();
}

function _adminHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _getAdminToken() };
}

async function _adminHeadersAsync() {
  var token = await _getAdminTokenAsync();
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
}

async function workerGrantCredit(email, amount) {
  var res = await fetch(_WORKER_URL + '/admin/grant-credit', {
    method: 'POST',
    headers: _adminHeaders(),
    body: JSON.stringify({ email: email, amount: amount })
  });
  var data = await res.json();
  if (!res.ok) throw new Error(data.error || '지급 실패');
  return data.newBalance;
}

async function loadSupaMembers() {
  try {
    var res = await fetch(_WORKER_URL + '/admin/members', {
      method: 'POST',
      headers: _adminHeaders(),
      body: JSON.stringify({})
    });
    if (!res.ok) throw new Error('회원 조회 실패 (' + res.status + ')');
    _supaMembers = await res.json();
    return _supaMembers;
  } catch (e) {
    console.warn('[Admin] Members load error:', e.message);
    _supaMembers = [];
    return [];
  }
}

function getInquiries() {
  try { return JSON.parse(localStorage.getItem('tr_support')) || []; } catch(e) { return []; }
}
function getAnalytics() {
  try { return JSON.parse(localStorage.getItem('tf_site_analytics')) || {}; } catch(e) { return {}; }
}
function getNotices() {
  try { return JSON.parse(localStorage.getItem('tf_notices')) || []; } catch(e) { return []; }
}
function getPointLog() {
  try { return JSON.parse(localStorage.getItem('tf_admin_point_log')) || []; } catch(e) { return []; }
}

function today() { return new Date().toISOString().slice(0,10); }
function thisMonth() { return new Date().toISOString().slice(0,7); }
function fmtDate(d) {
  if (!d) return '-';
  var dt = new Date(d);
  return dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0');
}
function fmtDateTime(d) {
  if (!d) return '-';
  var dt = new Date(d);
  return fmtDate(d) + ' ' + String(dt.getHours()).padStart(2,'0') + ':' + String(dt.getMinutes()).padStart(2,'0');
}
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

/* ═════════════════════════════════════
   대시보드
   ═════════════════════════════════════ */
async function renderDashboard() {
  // Supabase에서 회원 로드
  var accounts = await loadSupaMembers();
  var inquiries = getInquiries();
  var analytics = getAnalytics();
  var td = today();
  var mo = thisMonth();

  var todayVisits = (analytics.dailyVisits && analytics.dailyVisits[td]) || 0;
  var monthVisits = (analytics.monthlyVisits && analytics.monthlyVisits[mo]) || 0;
  var totalVisits = analytics.totalVisits || 0;

  var todaySignups = accounts.filter(function(a) { return a.created_at && a.created_at.slice(0,10) === td; }).length;
  var monthSignups = accounts.filter(function(a) { return a.created_at && a.created_at.slice(0,7) === mo; }).length;

  document.getElementById('dashCards').innerHTML =
    card('총 회원', accounts.length, '') +
    card('이번 달 가입', monthSignups, '오늘 ' + todaySignups + '명') +
    card('오늘 방문', todayVisits, '월 ' + monthVisits.toLocaleString()) +
    card('미답변 문의', inquiries.filter(function(i) { return !i.replied; }).length, '전체 ' + inquiries.length + '건');

  // 최근 가입 (이미 created_at 내림차순 정렬됨)
  var recent = accounts.slice(0, 5);
  var rows = recent.map(function(a) {
    return '<tr><td>' + esc(a.display_name || '이름 없음') + '</td><td>' + esc(a.email) + '</td><td>' + fmtDate(a.created_at) + '</td></tr>';
  }).join('');
  document.getElementById('recentMembers').innerHTML = rows || '<tr><td colspan="3" style="text-align:center;color:#ccc;padding:20px;">가입 회원이 없습니다.</td></tr>';

  // 최근 문의
  var recentInq = inquiries.slice().sort(function(a,b) { return (b.time||0) - (a.time||0); }).slice(0,3);
  if (recentInq.length === 0) {
    document.getElementById('recentInquiries').innerHTML = '<div style="text-align:center;padding:20px;color:#ccc;">문의가 없습니다.</div>';
  } else {
    document.getElementById('recentInquiries').innerHTML = recentInq.map(function(inq) {
      return '<div class="inquiry-card"><div class="inquiry-meta"><span>' + esc(inq.name || '비회원') + '</span><span>' + fmtDateTime(inq.time) + '</span></div><div class="inquiry-text">' + esc(inq.text) + '</div></div>';
    }).join('');
  }
}

function card(label, value, sub) {
  return '<div class="stat-card"><div class="stat-card-label">' + label + '</div><div class="stat-card-value">' + (typeof value === 'number' ? value.toLocaleString() : value) + '</div>' + (sub ? '<div class="stat-card-sub">' + sub + '</div>' : '') + '</div>';
}

/* ═════════════════════════════════════
   회원 관리
   ═════════════════════════════════════ */
async function renderMembers(filter) {
  if (_supaMembers.length === 0) await loadSupaMembers();
  var list = _supaMembers;
  if (filter) {
    var f = filter.toLowerCase();
    list = list.filter(function(a) {
      return (a.display_name||'').toLowerCase().includes(f) || (a.email||'').toLowerCase().includes(f);
    });
  }

  // 회원 수 표시
  var countEl = document.getElementById('memberCount');
  if (countEl) countEl.textContent = list.length + '명' + (filter ? ' (검색결과)' : '');

  var rows = list.map(function(a, idx) {
    var sub = (a.subscriptions && a.subscriptions.length > 0) ? a.subscriptions[0] : (a.subscriptions || {});
    var credit = sub.credit_balance || 0;
    var isAdmin = (a.is_admin === true) || a.email === _ADMIN_EMAIL;
    var isSpam = /^probe-/.test(a.email) || /@joriekol\.resend\.app/.test(a.email) || /@example\.invalid/.test(a.email);
    var rowStyle = isSpam ? ' style="background:#fff5f5;"' : '';
    var visitCount = a.visit_count || 0;
    var paidCount = a.paid_count || 0;
    var paidTotal = a.paid_total || 0;
    var nameBadges = '';
    if (isAdmin) nameBadges += ' <span style="background:#BF8C80;color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:6px;">관리자</span>';
    if (isSpam) nameBadges += ' <span style="color:#C62828;font-size:10px;font-weight:700;">스팸</span>';
    return '<tr' + rowStyle + '>' +
      '<td style="text-align:center;"><input type="checkbox" class="member-chk" data-email="' + esc(a.email) + '" data-name="' + esc(a.display_name || '이름 없음') + '" onchange="updateSelectedCount()"' + (isAdmin ? ' disabled' : '') + '></td>' +
      '<td style="color:#bbb;font-size:11px;">' + (idx + 1) + '</td>' +
      '<td>' + esc(a.display_name || '이름 없음') + nameBadges + '</td>' +
      '<td style="font-size:12px;">' + esc(a.email) + '</td>' +
      '<td>' + fmtDate(a.created_at) + '</td>' +
      '<td>' + (paidCount > 0 ? '<span class="badge badge-active">유료</span>' : '<span style="color:#ccc;">-</span>') + '</td>' +
      '<td>' + (credit >= 900000000 ? '∞' : credit.toLocaleString() + '文') + '</td>' +
      '<td style="text-align:right;font-variant-numeric:tabular-nums;">' + visitCount.toLocaleString() + '</td>' +
      '<td style="text-align:right;font-variant-numeric:tabular-nums;">' +
        (paidCount > 0
          ? ('<strong>' + paidTotal.toLocaleString() + '원</strong><br><span style="color:#999;font-size:11px;">' + paidCount + '회</span>')
          : '<span style="color:#ccc;">-</span>') +
      '</td>' +
      '<td>' +
        '<button data-action="detail" data-id="' + esc(a.id) + '" style="padding:4px 10px;background:var(--orange);color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-family:var(--font);margin-right:4px;">상세</button>' +
        (isAdmin ? '' : '<button data-action="delete" data-id="' + esc(a.id) + '" data-email="' + esc(a.email) + '" style="padding:4px 10px;background:#C62828;color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-family:var(--font);">삭제</button>') +
      '</td>' +
    '</tr>';
  }).join('');

  document.getElementById('memberList').innerHTML = rows || '<tr><td colspan="10" style="text-align:center;color:#ccc;padding:20px;">회원이 없습니다.</td></tr>';
  updateSelectedCount();
}

function filterMembers(q) { renderMembers(q); }

function toggleAllMembers(masterChk) {
  document.querySelectorAll('.member-chk:not(:disabled)').forEach(function(chk) { chk.checked = masterChk.checked; });
  updateSelectedCount();
}

function updateSelectedCount() {
  var checked = document.querySelectorAll('.member-chk:checked').length;
  var el = document.getElementById('selectedCount');
  var btn = document.getElementById('btnGrantSelected');
  var btnEmail = document.getElementById('btnSendEmail');
  if (el) el.textContent = checked > 0 ? checked + '명 선택' : '';
  if (btn) btn.style.display = checked > 0 ? 'inline-block' : 'none';
  if (btnEmail) btnEmail.style.display = checked > 0 ? 'inline-block' : 'none';
}

/* 공통 일괄 크레딧 지급 */
async function _bulkGrantCredits(targets, amount, reason) {
  var success = 0, fail = 0, results = [];
  var log = getPointLog();
  for (var i = 0; i < targets.length; i++) {
    try {
      var newBal = await workerGrantCredit(targets[i].email, amount);
      success++;
      results.push(targets[i].email + ': 성공 (' + (newBal || 0).toLocaleString() + '文)');
      log.push({ email: targets[i].email, type: 'grant', amount: amount, reason: reason, date: Date.now() });
    } catch (e) { fail++; results.push(targets[i].email + ': 실패 - ' + e.message); }
  }
  if (log.length > 1000) log = log.slice(-1000);
  localStorage.setItem('tf_admin_point_log', JSON.stringify(log));
  alert('일괄 지급 완료\n성공: ' + success + '건, 실패: ' + fail + '건\n\n' + results.join('\n'));
  _supaMembers = [];
  await loadSupaMembers();
  renderMembers();
  renderPoints();
}

async function grantSelectedMembers() {
  var checked = document.querySelectorAll('.member-chk:checked');
  if (checked.length === 0) { alert('회원을 선택하세요.'); return; }

  var amount = parseInt(prompt('지급할 금액 (文)을 입력하세요:', '10000'));
  if (!amount || amount <= 0) return;
  var reason = prompt('지급 사유:', '관리자 일괄 지급') || '관리자 일괄 지급';

  var targets = [];
  checked.forEach(function(chk) { targets.push({ email: chk.dataset.email, name: chk.dataset.name }); });
  var nameList = targets.map(function(t) { return t.name + ' (' + t.email + ')'; }).join('\n');
  if (!confirm(targets.length + '명에게 ' + amount.toLocaleString() + '文을 지급합니다.\n\n' + nameList)) return;

  await _bulkGrantCredits(targets, amount, reason);
}

async function sendCreditEmailToSelected() {
  var checked = document.querySelectorAll('.member-chk:checked');
  if (checked.length === 0) { alert('회원을 선택하세요.'); return; }

  var amount = parseInt(prompt('지급된 금액 (文)을 입력하세요:', '10000'));
  if (!amount || amount <= 0) return;
  if (!confirm(checked.length + '명에게 크레딧 지급 알림 이메일을 발송합니다.')) return;

  var success = 0, fail = 0, results = [];
  for (var i = 0; i < checked.length; i++) {
    var email = checked[i].dataset.email;
    var member = _supaMembers.find(function(m) { return m.email === email; });
    var sub = member && member.subscriptions && member.subscriptions.length > 0 ? member.subscriptions[0] : {};
    var balance = sub.credit_balance || 0;
    try {
      var res = await fetch(_WORKER_URL + '/admin/send-credit-email', {
        method: 'POST',
        headers: _adminHeaders(),
        body: JSON.stringify({ email: email, amount: amount, balance: balance })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || '발송 실패');
      success++;
      results.push(email + ': 발송 성공');
    } catch (e) { fail++; results.push(email + ': 실패 - ' + e.message); }
  }
  alert('이메일 발송 완료\n성공: ' + success + '건, 실패: ' + fail + '건\n\n' + results.join('\n'));
}

function openMemberDetail(userId) {
  var a = _supaMembers.find(function(x) { return x.id === userId; });
  if (!a) return;
  var sub = (a.subscriptions && a.subscriptions.length > 0) ? a.subscriptions[0] : (a.subscriptions || {});
  var credit = sub.credit_balance || 0;
  var isAdmin = a.email === _ADMIN_EMAIL;
  var html =
    '<div style="margin-bottom:12px;"><strong>이름:</strong> ' + esc(a.display_name || '이름 없음') + '</div>' +
    '<div style="margin-bottom:12px;"><strong>이메일:</strong> ' + esc(a.email) + '</div>' +
    '<div style="margin-bottom:12px;"><strong>가입일:</strong> ' + fmtDate(a.created_at) + '</div>' +
    '<div style="margin-bottom:12px;"><strong>플랜:</strong> ' + ((a.paid_count || 0) > 0 ? '유료 (' + (a.paid_total || 0).toLocaleString() + '원 / ' + (a.paid_count || 0) + '회)' : '-') + '</div>' +
    '<div style="margin-bottom:12px;"><strong>잔여 文:</strong> ' + (credit >= 900000000 ? '∞' : credit.toLocaleString() + '文') + '</div>' +
    '<div style="margin-bottom:12px;"><strong>무료 체험:</strong> ' + (sub.free_uses_remaining || 0) + '회 남음</div>' +
    '<div style="margin-bottom:12px;"><strong>ID:</strong> <span style="font-size:11px;color:#999;">' + esc(a.id) + '</span></div>';
  if (!isAdmin) {
    html += '<div style="margin-top:16px;padding-top:16px;border-top:1px solid #f0f0f0;">' +
      '<button data-action="delete" data-id="' + esc(a.id) + '" data-email="' + esc(a.email) + '" style="padding:8px 16px;background:#C62828;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);">이 회원 삭제</button></div>';
  }
  document.getElementById('memberDetail').innerHTML = html;
  document.getElementById('memberModal').classList.add('show');
}
function closeMemberModal() {
  document.getElementById('memberModal').classList.remove('show');
}

async function deleteMember(userId, email) {
  if (!confirm('정말 이 회원을 삭제하시겠습니까?\n\n' + email + '\n\n삭제하면 복구할 수 없습니다.')) return;
  if (!confirm('최종 확인: ' + email + ' 계정을 영구 삭제합니다.')) return;

  try {
    var res = await fetch(_WORKER_URL + '/admin/delete-member', {
      method: 'POST',
      headers: _adminHeaders(),
      body: JSON.stringify({ userId: userId })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || '삭제 실패');
    alert(email + ' 삭제 완료');
    closeMemberModal();
    _supaMembers = [];
    await loadSupaMembers();
    renderMembers();
    renderDashboard();
  } catch (e) {
    alert('삭제 실패: ' + e.message);
  }
}

async function bulkGrantZeroMembers() {
  if (_supaMembers.length === 0) await loadSupaMembers();
  var zeroList = _supaMembers.filter(function(a) {
    if (a.email === _ADMIN_EMAIL) return false;
    var sub = (a.subscriptions && a.subscriptions.length > 0) ? a.subscriptions[0] : (a.subscriptions || {});
    var credit = sub.credit_balance || 0;
    return credit === 0;
  });
  if (zeroList.length === 0) { alert('0文 회원이 없습니다.'); return; }

  var amount = parseInt(prompt('지급할 금액 (文)을 입력하세요:', '10000'));
  if (!amount || amount <= 0) return;
  var reason = prompt('지급 사유:', '관리자 일괄 지급') || '관리자 일괄 지급';

  var emailList = zeroList.map(function(a) { return (a.display_name || '이름없음') + ' (' + a.email + ')'; }).join('\n');
  if (!confirm('0文 회원 ' + zeroList.length + '명에게 ' + amount.toLocaleString() + '文을 지급합니다.\n\n' + emailList)) return;

  var targets = zeroList.map(function(a) { return { email: a.email, name: a.display_name || '이름없음' }; });
  await _bulkGrantCredits(targets, amount, reason);
}

async function deleteSpamMembers() {
  var spamList = _supaMembers.filter(function(a) {
    return /^probe-/.test(a.email) || /@joriekol\.resend\.app/.test(a.email) || /@example\.invalid/.test(a.email);
  });
  if (spamList.length === 0) { alert('스팸 계정이 없습니다.'); return; }
  if (!confirm('스팸 계정 ' + spamList.length + '개를 일괄 삭제하시겠습니까?\n\n' + spamList.map(function(a) { return a.email; }).join('\n'))) return;

  var success = 0, fail = 0;
  for (var i = 0; i < spamList.length; i++) {
    try {
      var res = await fetch(_WORKER_URL + '/admin/delete-member', {
        method: 'POST',
        headers: _adminHeaders(),
        body: JSON.stringify({ userId: spamList[i].id })
      });
      if (res.ok) success++; else fail++;
    } catch (e) { fail++; }
  }
  alert('삭제 완료: ' + success + '건 성공' + (fail > 0 ? ', ' + fail + '건 실패' : ''));
  _supaMembers = [];
  await loadSupaMembers();
  renderMembers();
  renderDashboard();
}

/* ═════════════════════════════════════
   고객 문의
   ═════════════════════════════════════ */
function renderInquiries() {
  var inquiries = getInquiries();
  inquiries.sort(function(a,b) { return (b.time||0) - (a.time||0); });

  if (inquiries.length === 0) {
    document.getElementById('inquiryList').innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;">문의가 없습니다.</div>';
    return;
  }

  document.getElementById('inquiryList').innerHTML = inquiries.map(function(inq, i) {
    var html = '<div class="inquiry-card">' +
      '<div class="inquiry-meta"><span>' + esc(inq.name || '비회원') + '</span><span>' + esc(inq.email || '') + '</span><span>' + fmtDateTime(inq.time) + '</span></div>' +
      '<div class="inquiry-text">' + esc(inq.text) + '</div>';
    if (inq.reply) {
      html += '<div class="inquiry-reply"><strong>답변:</strong> ' + esc(inq.reply) + '</div>';
    } else {
      html += '<input class="reply-input" id="reply-' + i + '" placeholder="답변을 입력하세요...">';
      html += '<button class="reply-btn" onclick="replyInquiry(' + i + ')">답변 저장</button>';
    }
    html += '</div>';
    return html;
  }).join('');
}

function replyInquiry(idx) {
  var input = document.getElementById('reply-' + idx);
  if (!input || !input.value.trim()) return;
  var inquiries = getInquiries();
  var sorted = inquiries.slice().sort(function(a,b) { return (b.time||0) - (a.time||0); });
  var target = sorted[idx];
  if (!target) return;
  // 원본에서 찾기
  var origIdx = inquiries.findIndex(function(inq) { return inq.time === target.time && inq.text === target.text; });
  if (origIdx >= 0) {
    inquiries[origIdx].reply = input.value.trim();
    inquiries[origIdx].replied = true;
    inquiries[origIdx].repliedAt = Date.now();
    localStorage.setItem('tr_support', JSON.stringify(inquiries));
    renderInquiries();
  }
}

/* ═════════════════════════════════════
   文 관리
   ═════════════════════════════════════ */
async function renderPoints() {
  if (_supaMembers.length === 0) await loadSupaMembers();
  var log = getPointLog();

  var totalIssued = 0, totalDeducted = 0;
  log.forEach(function(l) {
    if (l.type === 'grant') totalIssued += l.amount;
    else totalDeducted += l.amount;
  });

  document.getElementById('pointCards').innerHTML =
    card('총 지급', totalIssued.toLocaleString() + '文', '') +
    card('총 차감', totalDeducted.toLocaleString() + '文', '') +
    card('이력 건수', log.length, '');

  var rows = log.slice().reverse().slice(0,50).map(function(l) {
    return '<tr>' +
      '<td>' + esc(l.email) + '</td>' +
      '<td><span class="badge ' + (l.type==='grant'?'badge-active':'badge-inactive') + '">' + (l.type==='grant'?'지급':'차감') + '</span></td>' +
      '<td>' + (l.type==='grant'?'+':'-') + l.amount.toLocaleString() + '文</td>' +
      '<td>' + esc(l.reason) + '</td>' +
      '<td>' + fmtDateTime(l.date) + '</td>' +
    '</tr>';
  }).join('');

  document.getElementById('pointHistory').innerHTML = rows || '<tr><td colspan="5" style="text-align:center;color:#ccc;padding:20px;">이력이 없습니다.</td></tr>';
}

async function openPointModal() {
  if (_supaMembers.length === 0) await loadSupaMembers();
  var sel = document.getElementById('pmTarget');
  sel.innerHTML = _supaMembers.map(function(a) {
    return '<option value="' + esc(a.email) + '">' + esc(a.display_name || '이름 없음') + ' (' + esc(a.email) + ')</option>';
  }).join('');
  if (_supaMembers.length === 0) sel.innerHTML = '<option>회원 없음</option>';
  document.getElementById('pmAmount').value = '';
  document.getElementById('pmReason').value = '';
  document.getElementById('pointModal').classList.add('show');
}
function closePointModal() {
  document.getElementById('pointModal').classList.remove('show');
}

async function execPointAction() {
  var email = document.getElementById('pmTarget').value;
  var type = document.getElementById('pmType').value;
  var amount = parseInt(document.getElementById('pmAmount').value) || 0;
  var reason = document.getElementById('pmReason').value.trim();
  if (!email || !amount || amount <= 0) { alert('금액을 올바르게 입력하세요.'); return; }
  if (type === 'deduct') { alert('차감은 현재 지원하지 않습니다.'); return; }

  try {
    var newBalance = await workerGrantCredit(email, amount);
    var log = getPointLog();
    log.push({ email: email, type: type, amount: amount, reason: reason || '관리자 지급', date: Date.now() });
    if (log.length > 1000) log = log.slice(-1000);
    localStorage.setItem('tf_admin_point_log', JSON.stringify(log));

    closePointModal();
    renderPoints();
    await loadSupaMembers();
    alert('지급 완료: ' + amount.toLocaleString() + '文\n현재 잔액: ' + (newBalance != null ? newBalance.toLocaleString() : '?') + '文');
  } catch (e) {
    alert('지급 실패: ' + e.message);
  }
}

/* ═════════════════════════════════════
   공지사항
   ═════════════════════════════════════ */
function renderNotices() {
  var notices = getNotices();
  if (notices.length === 0) {
    document.getElementById('noticeList').innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;">공지가 없습니다.</div>';
    return;
  }
  document.getElementById('noticeList').innerHTML = notices.slice().reverse().map(function(n, i) {
    var idx = notices.length - 1 - i;
    return '<div class="notice-item"><div><div class="notice-title">' + esc(n.title) + '</div><div class="notice-date">' + fmtDate(n.date) + '</div></div><button class="notice-del" onclick="deleteNotice(' + idx + ')">삭제</button></div>';
  }).join('');
}

function openNoticeModal() {
  document.getElementById('nmTitle').value = '';
  document.getElementById('nmContent').value = '';
  document.getElementById('noticeModal').classList.add('show');
}
function closeNoticeModal() {
  document.getElementById('noticeModal').classList.remove('show');
}

function saveNotice() {
  var title = document.getElementById('nmTitle').value.trim();
  var content = document.getElementById('nmContent').value.trim();
  if (!title) { alert('제목을 입력하세요.'); return; }
  var notices = getNotices();
  notices.push({ title: title, content: content, date: Date.now() });
  localStorage.setItem('tf_notices', JSON.stringify(notices));
  closeNoticeModal();
  renderNotices();
}

function deleteNotice(idx) {
  if (!confirm('이 공지를 삭제하시겠습니까?')) return;
  var notices = getNotices();
  notices.splice(idx, 1);
  localStorage.setItem('tf_notices', JSON.stringify(notices));
  renderNotices();
}

/* ═════════════════════════════════════
   매출/통계
   ═════════════════════════════════════ */
async function renderStats() {
  var analytics = getAnalytics();
  if (_supaMembers.length === 0) await loadSupaMembers();
  var accounts = _supaMembers;
  var td = today();
  var mo = thisMonth();

  var todayVisits = (analytics.dailyVisits && analytics.dailyVisits[td]) || 0;
  var monthVisits = (analytics.monthlyVisits && analytics.monthlyVisits[mo]) || 0;
  var totalVisits = analytics.totalVisits || 0;

  document.getElementById('statsCards').innerHTML =
    card('총 방문', totalVisits.toLocaleString(), '') +
    card('월 방문', monthVisits.toLocaleString(), '') +
    card('총 회원', accounts.length, '') +
    card('월 가입', accounts.filter(function(a) { return a.created_at && a.created_at.slice(0,7) === mo; }).length, '');

  // 간단한 텍스트 기반 차트 (최근 14일)
  var dailyVisits = analytics.dailyVisits || {};
  var days = [];
  for (var i = 13; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var key = d.toISOString().slice(0,10);
    days.push({ date: key.slice(5), count: dailyVisits[key] || 0 });
  }

  var maxCount = Math.max.apply(null, days.map(function(d) { return d.count; })) || 1;
  var chartHtml = '<div style="display:flex;align-items:flex-end;gap:4px;height:120px;">';
  days.forEach(function(d) {
    var h = Math.max(4, (d.count / maxCount) * 100);
    chartHtml += '<div style="flex:1;text-align:center;">' +
      '<div style="font-size:10px;color:#999;margin-bottom:2px;">' + d.count + '</div>' +
      '<div style="height:' + h + 'px;background:var(--orange);border-radius:4px 4px 0 0;"></div>' +
      '<div style="font-size:9px;color:#bbb;margin-top:4px;">' + d.date + '</div>' +
    '</div>';
  });
  chartHtml += '</div>';
  document.getElementById('visitChart').innerHTML = chartHtml;
}

/* ═════════════════════════════════════
   콘텐츠
   ═════════════════════════════════════ */
function renderContent() {
  // 규칙 수: CORRECTION_RULES가 있으면 카운트
  document.getElementById('contentRuleCount').textContent =
    (typeof CORRECTION_RULES !== 'undefined' ? CORRECTION_RULES.length : '~100');
  document.getElementById('contentQuizCount').textContent =
    (typeof QUIZ_DATA !== 'undefined' ? QUIZ_DATA.length : '~50');
  document.getElementById('contentDailyCount').textContent = '35';
  document.getElementById('contentBlogCount').textContent = '3';
}

/* ═════════════════════════════════════
   이벤트 위임 (onclick XSS 방지)
   ═════════════════════════════════════ */
document.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;
  var action = btn.dataset.action;
  if (action === 'detail') openMemberDetail(btn.dataset.id);
  else if (action === 'delete') deleteMember(btn.dataset.id, btn.dataset.email);
});

/* ═════════════════════════════════════
   초기화
   ═════════════════════════════════════ */
(function init() {
  // 세션 복원 시에도 Supabase 세션 유효성 재확인
  if (sessionStorage.getItem('tf_admin') === 'ok') {
    var session = _getSupabaseSessionFromStorage();
    var user = session && session.user;
    if (user && user.email && typeof isAdminEmail === 'function' && isAdminEmail(user.email)) {
      showAdmin();
      return;
    }
    // 세션 무효 시 초기화
    sessionStorage.removeItem('tf_admin');
  }
})();

/* ══════════════════════════════════════
   유입 분석
   ══════════════════════════════════════ */
var _refDays = 1;

window.toggleSearchKeywords = function(id, btn) {
  var el = document.getElementById(id);
  if (!el) return;
  var open = el.classList.toggle('open');
  if (btn) btn.textContent = btn.textContent.replace(/[▾▴]/, open ? '▴' : '▾');
};

async function loadReferrerStats(days, btnEl) {
  _refDays = days || 7;
  // 버튼 활성화
  if (btnEl) {
    document.querySelectorAll('.ref-period-btn').forEach(function(b) { b.classList.remove('on'); });
    btnEl.classList.add('on');
  }

  var headers = await _adminHeadersAsync();
  if (!headers.Authorization.replace('Bearer ', '')) {
    var totalEl0 = document.getElementById('refTotal');
    if (totalEl0) totalEl0.textContent = '로그인 세션이 만료되었습니다. 다시 로그인해주세요.';
    return;
  }

  // Worker 경유 호출 (Service Role 기반 집계, RLS 우회)
  fetch(_WORKER_URL + '/admin/referrer-stats', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ days: _refDays })
  })
  .then(function(r) {
    if (!r.ok) return r.text().then(function(t) { throw new Error('HTTP ' + r.status + ': ' + (t || '').slice(0, 200)); });
    return r.json();
  })
  .then(function(data) {
    if (data && data.error) {
      console.warn('[Admin] Referrer stats:', data.error);
      var totalEl = document.getElementById('refTotal');
      if (totalEl) totalEl.textContent = '서버 오류: ' + data.error;
      return;
    }
    try {
      renderReferrerStats(data);
    } catch (e) {
      console.error('[Admin] renderReferrerStats failed:', e && e.stack || e);
      var totalEl = document.getElementById('refTotal');
      if (totalEl) totalEl.textContent = '렌더 오류: ' + (e && e.message || e);
    }
  })
  .catch(function(e) {
    console.error('[Admin] Referrer stats error:', e);
    var totalEl = document.getElementById('refTotal');
    if (totalEl) totalEl.textContent = '오류: ' + (e && e.message || e);
  });
}

window.refreshTodayLogs = async function() {
  var btn = document.getElementById('todayLogsRefreshBtn');
  if (btn) { btn.textContent = '새로고침 중...'; btn.disabled = true; }
  var headers = await _adminHeadersAsync();
  fetch(_WORKER_URL + '/admin/referrer-stats', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ days: 1 })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data && data.today_logs) renderTodayLogs(data.today_logs);
  })
  .catch(function(e) { console.warn('[Admin] today logs refresh error:', e); })
  .finally(function() {
    if (btn) { btn.textContent = '새로고침'; btn.disabled = false; }
  });
};

function _fmtDuration(sec) {
  if (sec == null) return '-';
  if (sec < 1) return '<1초';
  if (sec < 60) return sec + '초';
  var m = Math.floor(sec / 60), s = sec % 60;
  if (sec < 3600) return s === 0 ? m + '분' : m + '분 ' + s + '초';
  var h = Math.floor(sec / 3600), rm = Math.floor((sec % 3600) / 60);
  return rm === 0 ? h + '시간' : h + '시간 ' + rm + '분';
}

function renderTodayLogs(today) {
  var el = document.getElementById('refTodayLogs');
  var sub = document.getElementById('todayLogsSubtitle');
  if (!el) return;

  if (!today) {
    if (sub) sub.textContent = '기간이 "오늘"일 때만 표시됩니다';
    el.innerHTML = '<div style="color:#999;font-size:13px;text-align:center;padding:30px;">기간을 "오늘"로 선택하면 방문 로그가 표시됩니다</div>';
    return;
  }

  if (sub) sub.textContent = today.total.toLocaleString() + '건 · 고유 방문자 ' + today.uniqueVisitors + '명 (로그인+익명)';

  var logs = today.logs || [];
  if (logs.length === 0) {
    el.innerHTML = '<div style="color:#999;font-size:13px;text-align:center;padding:30px;">오늘 방문 기록이 없습니다</div>';
    return;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  var html = '<table style="width:100%;font-size:12px;border-collapse:collapse;">';
  html += '<thead style="position:sticky;top:0;background:#fff;z-index:1;">';
  html += '<tr style="border-bottom:1px solid #eee;color:#999;font-size:10px;">';
  html += '<th style="text-align:left;padding:8px 12px;font-weight:600;width:64px;">시간</th>';
  html += '<th style="text-align:left;padding:8px 12px;font-weight:600;">사용자</th>';
  html += '<th style="text-align:left;padding:8px 12px;font-weight:600;">페이지</th>';
  html += '<th style="text-align:left;padding:8px 12px;font-weight:600;">유입</th>';
  html += '<th style="text-align:left;padding:8px 12px;font-weight:600;width:80px;">체류</th>';
  html += '</tr></thead><tbody>';

  for (var i = 0; i < logs.length; i++) {
    var log = logs[i];
    var t = new Date(log.visited_at);
    var timeLabel = isNaN(t) ? '-' : t.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    var userCell = '';
    if (log.visitor_type === 'member') {
      var memberLabel = log.nickname
        || (log.email ? log.email.split('@')[0] : '')
        || (log.user_id ? '회원 ' + String(log.user_id).slice(0, 8) : '(미등록)');
      var emailHint = (log.email && log.nickname) ? ' <span style="font-size:11px;color:#999;font-weight:400;">' + esc(log.email) + '</span>' : '';
      userCell = '<span style="display:inline-flex;align-items:center;gap:6px;">' +
        '<span style="font-size:9px;font-weight:700;color:#fff;background:var(--orange);padding:2px 7px;border-radius:10px;line-height:1;">회원</span>' +
        '<span style="font-weight:600;">' + esc(memberLabel) + '</span>' + emailHint + '</span>';
    } else {
      var locParts = [];
      if (log.country) locParts.push(log.country);
      if (log.city) locParts.push(log.city);
      else if (log.region) locParts.push(log.region);
      var locLabel = locParts.length ? locParts.join(' ') : '';
      var ipLabel = log.ip_address || '';
      var hint = [esc(log.browser) + ' · ' + esc(log.os)];
      if (locLabel) hint.push(esc(locLabel));
      if (ipLabel) hint.push('<span style="font-family:monospace;font-size:10px;color:#bbb;">' + esc(ipLabel) + '</span>');
      userCell = '<span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
        '<span style="font-size:9px;font-weight:700;color:#999;background:#f5f5f5;padding:2px 7px;border-radius:10px;line-height:1;">익명</span>' +
        '<span style="color:#999;">' + hint.join(' · ') + '</span></span>';
    }

    html += '<tr style="border-bottom:1px solid #f5f5f5;">';
    html += '<td style="padding:8px 12px;color:#999;font-variant-numeric:tabular-nums;">' + timeLabel + '</td>';
    html += '<td style="padding:8px 12px;">' + userCell + '</td>';
    html += '<td style="padding:8px 12px;font-family:monospace;font-size:11px;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(log.page_path) + '</td>';
    html += '<td style="padding:8px 12px;color:#999;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(log.referrer_domain) + '</td>';
    html += '<td style="padding:8px 12px;color:#999;font-variant-numeric:tabular-nums;">' + _fmtDuration(log.duration_seconds) + '</td>';
    html += '</tr>';
  }

  html += '</tbody></table>';
  el.innerHTML = html;
}

function renderReferrerStats(data) {
  if (!data) return;
  var total = data.total || 0;
  var periodLabel = _refDays === 1 ? '오늘' : _refDays === 2 ? '어제' : _refDays + '일';
  var todayStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

  // 총 건수
  var totalEl = document.getElementById('refTotal');
  if (totalEl) totalEl.textContent = todayStr + ' · 총 ' + total.toLocaleString() + '건';

  // 요약 카드
  var devices = data.devices || { desktop: 0, mobile: 0, tablet: 0 };
  var totalDevices = (devices.desktop || 0) + (devices.mobile || 0) + (devices.tablet || 0);
  var cardsEl = document.getElementById('refSummaryCards');
  if (cardsEl) {
    var stay = data.stay_stats || { count: 0, avg: 0, median: 0 };
    function _fmtSec(s) {
      s = s || 0;
      if (s < 60) return s + '초';
      var m = Math.floor(s / 60), r = s % 60;
      if (m < 60) return m + '분 ' + r + '초';
      var h = Math.floor(m / 60); m = m % 60;
      return h + '시간 ' + m + '분';
    }
    var stayLabel = stay.count > 0
      ? _fmtSec(stay.median) + ' <span style="font-size:11px;color:#999;font-weight:400;">(평균 ' + _fmtSec(stay.avg) + ')</span>'
      : '<span style="font-size:13px;color:#999;font-weight:400;">데이터 수집 중</span>';
    var aiTotal = ((data.ai_referrers || []).reduce(function(s, x) { return s + (x.count || 0); }, 0));
    var aiPct = total > 0 ? Math.round((aiTotal / total) * 100) : 0;
    cardsEl.innerHTML =
      '<div class="stat-card"><div class="stat-label">' + periodLabel + ' 방문</div><div class="stat-value" style="color:var(--orange)">' + total.toLocaleString() + '</div></div>' +
      '<div class="stat-card"><div class="stat-label">AI 챗봇 유입</div><div class="stat-value" style="color:#7B1FA2;">' + aiTotal + '<span style="font-size:12px;color:#999;font-weight:400;margin-left:4px;">(' + aiPct + '%)</span></div></div>' +
      '<div class="stat-card"><div class="stat-label">유입 경로</div><div class="stat-value">' + ((data.referrers || []).length) + '개</div></div>' +
      '<div class="stat-card"><div class="stat-label">UTM 캠페인</div><div class="stat-value">' + ((data.utm_sources || []).length) + '개</div></div>' +
      '<div class="stat-card"><div class="stat-label">체류시간 (중앙값)</div><div class="stat-value" style="font-size:18px;">' + stayLabel + '</div></div>';
  }

  // 오늘 방문 로그 (days=1 일 때만 표시)
  renderTodayLogs(data.today_logs);

  // 유입 경로
  var refEl = document.getElementById('refReferrers');
  if (refEl) {
    var refs = data.referrers || [];
    if (refs.length === 0) {
      refEl.innerHTML = '<div style="color:#999;font-size:13px;">데이터 없음</div>';
    } else {
      var html = '';
      for (var i = 0; i < refs.length; i++) {
        var pct = total > 0 ? Math.min(100, (refs[i].count / total) * 100) : 0;
        html += '<div class="ref-bar-row"><span class="ref-bar-label">' + esc(refs[i].domain) + '</span><div class="ref-bar-wrap"><div class="ref-bar-fill" style="width:' + pct + '%"></div></div><span class="ref-bar-count">' + refs[i].count + '</span></div>';
      }
      refEl.innerHTML = html;
    }
  }

  // 기기
  var devEl = document.getElementById('refDevices');
  if (devEl) {
    if (totalDevices === 0) {
      devEl.innerHTML = '<div style="color:#999;font-size:13px;">데이터 없음</div>';
    } else {
      var devItems = [
        { label: '데스크톱', value: devices.desktop || 0, color: 'var(--orange)' },
        { label: '모바일', value: devices.mobile || 0, color: '#2DB400' },
        { label: '태블릿', value: devices.tablet || 0, color: '#F29C68' }
      ];
      var dhtml = '';
      for (var d = 0; d < devItems.length; d++) {
        var dpct = totalDevices > 0 ? Math.round((devItems[d].value / totalDevices) * 100) : 0;
        dhtml += '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="font-weight:600;">' + devItems[d].label + '</span><span style="color:#999;">' + devItems[d].value + '건 (' + dpct + '%)</span></div><div style="width:100%;height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;"><div style="height:100%;width:' + dpct + '%;background:' + devItems[d].color + ';border-radius:4px;"></div></div></div>';
      }
      devEl.innerHTML = dhtml;
    }
  }

  // OS / 브라우저 바 리스트 렌더러
  function renderBarList(elId, list, colorMap, defaultColor) {
    var el = document.getElementById(elId);
    if (!el) return;
    list = list || [];
    var sum = 0;
    for (var s = 0; s < list.length; s++) sum += (list[s].count || 0);
    if (sum === 0) {
      el.innerHTML = '<div style="color:#999;font-size:13px;">데이터 없음</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var name = list[i].name || '기타';
      var val = list[i].count || 0;
      var pct = Math.round((val / sum) * 100);
      var color = (colorMap && colorMap[name]) || defaultColor;
      html += '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="font-weight:600;">' + esc(name) + '</span><span style="color:#999;">' + val + '건 (' + pct + '%)</span></div><div style="width:100%;height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:4px;"></div></div></div>';
    }
    el.innerHTML = html;
  }

  // OS
  renderBarList('refOS', data.os_stats, {
    'Windows':  '#0078D4',
    'macOS':    '#999999',
    'iOS':      '#333333',
    'Android':  '#3DDC84',
    'Linux':    '#FCC624',
    'ChromeOS': '#4285F4',
    '기타':     '#C4B8B3'
  }, 'var(--orange)');

  // 브라우저
  renderBarList('refBrowsers', data.browser_stats, {
    'Chrome':           '#4285F4',
    'Safari':           '#0FB5EE',
    'Edge':             '#0078D7',
    'Firefox':          '#FF7139',
    'Opera':            '#FF1B2D',
    'Whale':            '#03C75A',
    'Samsung Internet': '#1428A0',
    '기타':             '#C4B8B3'
  }, 'var(--orange)');

  // 기기 × OS / 기기 × 브라우저 교차 집계
  var DEVICE_LABEL = { desktop: '데스크톱', mobile: '모바일', tablet: '태블릿' };
  var OS_COLORS_X = { 'Windows':'#0078D4', 'macOS':'#999999', 'iOS':'#333333', 'Android':'#3DDC84', 'Linux':'#FCC624', 'ChromeOS':'#4285F4', '기타':'#C4B8B3' };
  var BROWSER_COLORS_X = { 'Chrome':'#4285F4', 'Safari':'#0FB5EE', 'Edge':'#0078D7', 'Firefox':'#FF7139', 'Opera':'#FF1B2D', 'Whale':'#03C75A', 'Samsung Internet':'#1428A0', '기타':'#C4B8B3' };
  function renderCrossTab(elId, groups, colorMap) {
    var el = document.getElementById(elId);
    if (!el) return;
    groups = (groups || []).filter(function(g) { return g.total > 0; });
    if (groups.length === 0) {
      el.innerHTML = '<div style="color:#999;font-size:13px;">데이터 없음</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var devLabel = DEVICE_LABEL[g.device] || g.device;
      html += '<div style="margin-bottom:14px;">';
      html += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;"><span style="font-weight:700;">' + esc(devLabel) + '</span><span style="color:#999;">총 ' + g.total + '건</span></div>';
      html += '<div style="padding-left:10px;border-left:2px solid #eee;">';
      var items = g.items || [];
      for (var j = 0; j < items.length; j++) {
        var name = items[j].name || '기타';
        var val = items[j].count || 0;
        var pct = Math.round((val / g.total) * 100);
        var color = colorMap[name] || 'var(--orange)';
        html += '<div style="margin-bottom:6px;"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;"><span>' + esc(name) + '</span><span style="color:#999;">' + val + '건 (' + pct + '%)</span></div><div style="width:100%;height:6px;background:#f0f0f0;border-radius:3px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:3px;"></div></div></div>';
      }
      html += '</div></div>';
    }
    el.innerHTML = html;
  }
  renderCrossTab('refDeviceOS', data.device_os_stats, OS_COLORS_X);
  renderCrossTab('refDeviceBrowser', data.device_browser_stats, BROWSER_COLORS_X);

  // 검색엔진 + 검색어 (토글)
  var seEl = document.getElementById('refSearchEngines');
  if (seEl) {
    var engines = data.search_engines || [];
    var keywords = data.search_keywords || [];
    if (engines.length === 0) {
      seEl.innerHTML = '<div style="color:#999;font-size:13px;">데이터 없음</div>';
    } else {
      var seSum = 0;
      for (var ei = 0; ei < engines.length; ei++) seSum += (engines[ei].count || 0);
      var SE_COLORS = { 'Google':'#4285F4', 'Naver':'#03C75A', 'Daum':'#0066CC', 'Bing':'#008373', 'Yahoo':'#5F01D1', 'DuckDuckGo':'#DE5833', 'Yandex':'#FF0000', 'Baidu':'#2932E1', 'Zum':'#1B7CE5' };
      var sehtml = '';
      for (var e = 0; e < engines.length; e++) {
        var en = engines[e].name || engines[e].engine;
        var ec = engines[e].count || 0;
        var epct = seSum > 0 ? Math.round((ec / seSum) * 100) : 0;
        var ecolor = SE_COLORS[en] || 'var(--orange)';
        var kwForEngine = keywords.filter(function(k) { return k.engine === en && k.keyword; });
        sehtml += '<div style="margin-bottom:10px;">';
        sehtml += '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:4px;">';
        sehtml += '<span style="font-weight:600;">' + esc(en) + '</span>';
        sehtml += '<span style="color:#999;">' + ec + '건 (' + epct + '%)';
        if (kwForEngine.length > 0) {
          sehtml += '<span class="ref-keyword-toggle" onclick="toggleSearchKeywords(\'kw-' + esc(en) + '\', this)">검색어 ' + kwForEngine.length + '개 ▾</span>';
        }
        sehtml += '</span></div>';
        sehtml += '<div style="width:100%;height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;"><div style="height:100%;width:' + epct + '%;background:' + ecolor + ';border-radius:4px;"></div></div>';
        if (kwForEngine.length > 0) {
          sehtml += '<div class="ref-keyword-list" id="kw-' + esc(en) + '">';
          for (var ki = 0; ki < kwForEngine.length; ki++) {
            sehtml += '<div class="ref-keyword-item"><span class="kw-text">' + esc(kwForEngine[ki].keyword) + '</span><span class="kw-count">' + kwForEngine[ki].count + '</span></div>';
          }
          sehtml += '</div>';
        }
        sehtml += '</div>';
      }
      seEl.innerHTML = sehtml;
    }
  }

  // SNS / 메신저
  var snsEl = document.getElementById('refSnsList');
  if (snsEl) {
    var snsList = (data.sns_referrers || []).map(function(s) { return { name: s.platform, count: s.count }; });
    var SNS_COLORS = { '인스타그램':'#E1306C', '페이스북':'#1877F2', '쓰레드':'#000000', '유튜브':'#FF0000', 'X(트위터)':'#000000', '틱톡':'#FF0050', '카카오':'#FEE500', '디스코드':'#5865F2', '링크드인':'#0A66C2', '핀터레스트':'#E60023', '레딧':'#FF4500', '텔레그램':'#26A5E4', '라인':'#06C755', '슬랙':'#4A154B' };
    renderBarList('refSnsList', snsList, SNS_COLORS, 'var(--orange)');
  }

  // AI 챗봇 (LLM 추천 유입)
  var aiEl = document.getElementById('refAiBots');
  if (aiEl) {
    var aiList = (data.ai_referrers || []).map(function(a) { return { name: a.bot, count: a.count }; });
    var AI_COLORS = {
      'ChatGPT':    '#10A37F',
      'Claude':     '#D97757',
      'Perplexity': '#1FB8CD',
      'Gemini':     '#4285F4',
      'Copilot':    '#0078D7',
      'DeepSeek':   '#1A73E8',
      'Mistral':    '#FA520F',
      'Qwen':       '#615CED',
      '뤼튼':       '#7C3AED',
      '클로바X':    '#03C75A'
    };
    if (aiList.length === 0) {
      aiEl.innerHTML = '<div style="color:#999;font-size:13px;">데이터 없음</div>' +
        '<p style="font-size:10px;color:#ccc;margin-top:8px;">ChatGPT, Claude, Perplexity, Gemini 등의 추천 유입을 추적합니다</p>';
    } else {
      renderBarList('refAiBots', aiList, AI_COLORS, '#7B1FA2');
    }
  }

  // 외부 사이트 트리
  var treeEl = document.getElementById('refTree');
  if (treeEl) {
    var tree = data.referrer_tree || [];
    if (tree.length === 0) {
      treeEl.innerHTML = '<div style="color:#999;font-size:13px;">데이터 없음</div>';
    } else {
      var thtml = '';
      for (var t = 0; t < tree.length; t++) {
        var node = tree[t];
        thtml += '<div class="ref-tree-row">';
        thtml += '<div class="ref-tree-domain" onclick="this.classList.toggle(\'open\')"><span><span class="ref-tree-arrow">▶</span>' + esc(node.domain) + '</span><span style="color:#999;font-weight:700;">' + node.total + '</span></div>';
        thtml += '<div class="ref-tree-paths">';
        var paths = node.paths || [];
        for (var pp = 0; pp < paths.length; pp++) {
          thtml += '<div class="ref-tree-path"><span class="ref-tree-path-text">' + esc(paths[pp].path) + '</span><span class="ref-tree-path-count">' + paths[pp].count + '</span></div>';
        }
        thtml += '</div></div>';
      }
      treeEl.innerHTML = thtml;
    }
  }

  // 직접 방문 (인앱브라우저별)
  var diEl = document.getElementById('refDirectInapp');
  if (diEl) {
    var diList = (data.direct_inapp || []).map(function(d) { return { name: d.app, count: d.count }; });
    var INAPP_COLORS = { '브라우저':'#999999', '카카오톡':'#FEE500', '네이버 앱':'#03C75A', '인스타그램':'#E1306C', '페이스북':'#1877F2', '라인':'#06C755', '다음 앱':'#0066CC', '쓰레드':'#000000', '틱톡':'#FF0050', '웹뷰(기타)':'#C4B8B3' };
    renderBarList('refDirectInapp', diList, INAPP_COLORS, 'var(--orange)');
  }

  // 인기 페이지
  var pgEl = document.getElementById('refPages');
  if (pgEl) {
    var pages = data.pages || [];
    if (pages.length === 0) {
      pgEl.innerHTML = '<div style="color:#999;font-size:13px;">데이터 없음</div>';
    } else {
      var phtml = '';
      for (var p = 0; p < pages.length; p++) {
        phtml += '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:13px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">' + esc(pages[p].path) + '</span><span style="font-size:12px;color:#999;font-weight:700;margin-left:8px;">' + pages[p].count + '</span></div>';
      }
      pgEl.innerHTML = phtml;
    }
  }

  // UTM
  var utmEl = document.getElementById('refUtm');
  if (utmEl) {
    var utms = data.utm_sources || [];
    if (utms.length === 0) {
      utmEl.innerHTML = '<div style="color:#999;font-size:13px;">아직 UTM 데이터가 없습니다</div><p style="font-size:10px;color:#ccc;margin-top:8px;">?utm_source=naver&utm_medium=blog 형태로 링크 공유 시 추적됩니다</p>';
    } else {
      var uhtml = '';
      for (var u = 0; u < utms.length; u++) {
        uhtml += '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:13px;">' + esc(utms[u].source) + '</span><span style="font-size:12px;color:#999;font-weight:700;">' + utms[u].count + '</span></div>';
      }
      utmEl.innerHTML = uhtml;
    }
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
}


/* ═════════════════════════════════════
   1:1 맞춤법 상담 (Supabase 기반)
   ═════════════════════════════════════ */
var _spellcheckItems = [];

async function loadSpellcheckList(status) {
  var container = document.getElementById('spellcheckList');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;">불러오는 중...</div>';

  try {
    var url = 'https://jolly-term-4055.orange-e65.workers.dev/admin/spellcheck/list?limit=100';
    if (status) url += '&status=' + encodeURIComponent(status);
    var res = await fetch(url, { headers: _adminHeaders() });
    var data = await res.json();
    if (!res.ok) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#c00;">' + _esc(data.error || '조회 실패') + '</div>';
      return;
    }
    _spellcheckItems = data.items || [];
    renderSpellcheckList();
  } catch (e) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#c00;">네트워크 오류: ' + _esc(e.message) + '</div>';
  }
}

function renderSpellcheckList() {
  var container = document.getElementById('spellcheckList');
  if (!container) return;
  if (_spellcheckItems.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;">상담 요청이 없습니다.</div>';
    return;
  }

  container.innerHTML = _spellcheckItems.map(function(it, i) {
    var badge = it.status === 'replied'
      ? '<span style="background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">답변완료</span>'
      : '<span style="background:#F2F2F2;color:#BF8C80;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">대기중</span>';
    var dateStr = it.created_at ? new Date(it.created_at).toLocaleString('ko-KR') : '';

    var html = '<div class="inquiry-card" style="padding:16px 20px;border-bottom:1px solid #f0f0f0;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<div style="display:flex;gap:12px;align-items:center;">' +
          badge +
          '<span style="font-size:12px;color:#666;font-weight:600;">' + _esc(it.email) + '</span>' +
        '</div>' +
        '<span style="font-size:11px;color:#999;">' + _esc(dateStr) + '</span>' +
      '</div>' +
      '<div style="font-size:12px;font-weight:700;color:#BF8C80;margin:10px 0 4px;">원문</div>' +
      '<div style="font-size:13px;color:#333;line-height:1.6;white-space:pre-wrap;background:#FAFAF8;padding:10px;border-radius:6px;">' + _esc(it.original_text) + '</div>' +
      '<div style="font-size:12px;font-weight:700;color:#BF8C80;margin:10px 0 4px;">질문</div>' +
      '<div style="font-size:13px;color:#333;line-height:1.6;white-space:pre-wrap;background:#FAFAF8;padding:10px;border-radius:6px;">' + _esc(it.question) + '</div>';

    if (it.reply) {
      html += '<div style="font-size:12px;font-weight:700;color:#2E7D32;margin:12px 0 4px;">답변</div>' +
        '<div style="font-size:13px;color:#2D1B12;line-height:1.7;white-space:pre-wrap;background:#F1F8E9;padding:10px;border-radius:6px;border:1px solid #C5E1A5;">' + _esc(it.reply) + '</div>' +
        '<div style="font-size:11px;color:#999;margin-top:6px;">' + _esc(it.replied_at ? new Date(it.replied_at).toLocaleString('ko-KR') : '') + ' · ' + _esc(it.replied_by || '') + '</div>';
    } else {
      html += '<textarea id="sc-reply-' + it.id + '" placeholder="답변을 입력하세요 (2자~5,000자). 저장 시 사용자 이메일로 자동 발송됩니다." style="width:100%;min-height:100px;margin-top:12px;padding:10px;border:1px solid #F0E6DD;border-radius:8px;font-family:inherit;font-size:13px;line-height:1.6;box-sizing:border-box;resize:vertical;"></textarea>' +
        '<button class="reply-btn" style="margin-top:8px;background:#BF8C80;color:#fff;padding:10px 18px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;" onclick="submitSpellcheckReply(' + it.id + ')">답변 저장 + 이메일 발송</button>';
    }
    html += '</div>';
    return html;
  }).join('');
}

async function submitSpellcheckReply(id) {
  var ta = document.getElementById('sc-reply-' + id);
  if (!ta) return;
  var reply = ta.value.trim();
  if (reply.length < 2) { alert('답변을 2자 이상 입력해 주세요.'); return; }
  if (reply.length > 5000) { alert('답변은 최대 5,000자까지 입력할 수 있습니다.'); return; }
  if (!confirm('이 답변을 저장하고 사용자 이메일로 발송할까요?')) return;

  try {
    var res = await fetch('https://jolly-term-4055.orange-e65.workers.dev/admin/spellcheck/reply', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, _adminHeaders()),
      body: JSON.stringify({ id: id, reply: reply })
    });
    var data = await res.json();
    if (!res.ok || !data.ok) {
      alert(data.error || '저장 실패');
      return;
    }
    alert('답변이 저장되고 사용자에게 이메일이 발송되었습니다.');
    loadSpellcheckList('pending');
  } catch (e) {
    alert('네트워크 오류: ' + e.message);
  }
}

function _esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

/* ══════════════════════════════════════
   맞춤법 제보(error_reports) 관리
   ══════════════════════════════════════ */
var _reportStatus = 'pending';
var _reportItems = [];

function setReportStatus(status, btnEl) {
  _reportStatus = status;
  document.querySelectorAll('#tab-reports .sp-filter-btn').forEach(function(b) { b.classList.remove('on'); });
  if (btnEl) btnEl.classList.add('on');
  loadReports();
}

async function loadReports() {
  var container = document.getElementById('reportsList');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;">불러오는 중...</div>';

  var tool = (document.getElementById('reportToolFilter') || {}).value || '';
  var params = new URLSearchParams();
  if (_reportStatus) params.set('status', _reportStatus);
  if (tool) params.set('tool', tool);
  params.set('limit', '200');

  try {
    var res = await fetch(_WORKER_URL + '/admin/reports/list?' + params.toString(), {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, _adminHeaders()),
      body: JSON.stringify({})
    });
    var data = await res.json();
    if (!res.ok || !data.ok) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#c00;">' + _esc(data.error || '조회 실패') + '</div>';
      return;
    }
    _reportItems = data.items || [];
    renderReportCards(data.counts || {});
    renderReports();
  } catch (e) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#c00;">네트워크 오류: ' + _esc(e.message) + '</div>';
  }
}

function renderReportCards(counts) {
  var cards = document.getElementById('reportCards');
  if (!cards) return;
  var total = counts.total || 0;
  var pending = counts.pending || 0;
  var resolved = counts.resolved || 0;
  var ignored = counts.ignored || 0;
  cards.innerHTML =
    '<div class="stat-card"><div class="stat-card-label">전체 제보</div><div class="stat-card-value">' + total + '</div></div>' +
    '<div class="stat-card"><div class="stat-card-label">대기중</div><div class="stat-card-value" style="color:#E65100;">' + pending + '</div></div>' +
    '<div class="stat-card"><div class="stat-card-label">반영완료</div><div class="stat-card-value" style="color:#2E7D32;">' + resolved + '</div></div>' +
    '<div class="stat-card"><div class="stat-card-label">무시</div><div class="stat-card-value" style="color:#999;">' + ignored + '</div></div>';
}

function renderReports() {
  var container = document.getElementById('reportsList');
  if (!container) return;
  if (_reportItems.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;">제보가 없습니다.</div>';
    return;
  }

  var REASON_LABEL = {
    wrong_correction: '교정이 틀립니다',
    better_correction: '더 적절한 교정이 있음',
    missed_error: '놓친 오류',
    other: '기타'
  };
  var STATUS_BADGE = {
    pending:  '<span class="sp-status pending">대기중</span>',
    resolved: '<span class="sp-status approved">반영완료</span>',
    ignored:  '<span class="sp-status rejected">무시</span>'
  };

  container.innerHTML = _reportItems.map(function(r) {
    var dateStr = r.created_at ? new Date(r.created_at).toLocaleString('ko-KR') : '';
    var reason = REASON_LABEL[r.reason] || (r.reason || '-');
    var toolTxt = r.tool || (r.stage ? '에디터(' + r.stage + ')' : '-');

    var html = '<div class="inquiry-card" style="padding:16px 20px;border-bottom:1px solid #f0f0f0;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
          (STATUS_BADGE[r.status] || '') +
          '<span style="font-size:11px;color:#666;background:#F5E4DB;padding:2px 8px;border-radius:5px;font-weight:600;">' + _esc(toolTxt) + '</span>' +
          (r.category ? '<span style="font-size:11px;color:#888;">카테고리: ' + _esc(r.category) + '</span>' : '') +
          '<span style="font-size:11px;color:#888;">사유: ' + _esc(reason) + '</span>' +
        '</div>' +
        '<span style="font-size:11px;color:#999;">' + _esc(dateStr) + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0;">' +
        '<div><div style="font-size:11px;font-weight:700;color:#C62828;margin-bottom:4px;">원래 표현</div>' +
          '<div style="font-size:14px;font-weight:700;color:#333;background:#FFEBEE;padding:10px;border-radius:6px;">' + _esc(r.original || '') + '</div></div>' +
        '<div><div style="font-size:11px;font-weight:700;color:#2E7D32;margin-bottom:4px;">교정 결과</div>' +
          '<div style="font-size:14px;font-weight:700;color:#333;background:#E8F5E9;padding:10px;border-radius:6px;">' + _esc(r.replacement || '') + '</div></div>' +
      '</div>';

    if (r.correct_form) {
      html += '<div style="font-size:11px;font-weight:700;color:#1565C0;margin-top:8px;">사용자가 제안한 수정안 / 코멘트</div>' +
        '<div style="font-size:13px;color:#333;background:#E3F2FD;padding:10px;border-radius:6px;white-space:pre-wrap;">' + _esc(r.correct_form) + '</div>';
    }
    if (r.page_url) {
      html += '<div style="font-size:11px;color:#999;margin-top:6px;">출처: <a href="' + _esc(r.page_url) + '" target="_blank" style="color:#BF8C80;">' + _esc(r.page_url) + '</a></div>';
    }
    if (r.admin_note) {
      html += '<div style="font-size:11px;font-weight:700;color:#666;margin-top:8px;">관리자 메모</div>' +
        '<div style="font-size:13px;color:#333;background:#fafafa;border:1px solid #eee;padding:8px;border-radius:6px;">' + _esc(r.admin_note) + '</div>';
    }

    html += '<div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;align-items:center;">' +
      '<input type="text" id="rep-note-' + _esc(r.id) + '" placeholder="반영 규칙 / 메모 (선택)" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;font-family:inherit;" value="' + _esc(r.admin_note || '') + '">' +
      '<button class="sp-action-btn sp-approve" onclick="spacingExcFromReport(\'' + _esc(r.id) + '\',false)" style="background:#5D4037;color:#fff;">예외 등록</button>' +
      '<button class="sp-action-btn sp-approve" onclick="spacingExcFromReport(\'' + _esc(r.id) + '\',true)" style="background:#1565C0;color:#fff;">예외·승인</button>' +
      '<button class="sp-action-btn sp-approve" onclick="updateReport(\'' + _esc(r.id) + '\',\'resolved\')">반영완료</button>' +
      '<button class="sp-action-btn" style="background:#999;color:#fff;" onclick="updateReport(\'' + _esc(r.id) + '\',\'ignored\')">무시</button>' +
      (r.status !== 'pending' ? '<button class="sp-action-btn" style="background:#E65100;color:#fff;" onclick="updateReport(\'' + _esc(r.id) + '\',\'pending\')">대기로 되돌리기</button>' : '') +
      '<button class="sp-action-btn sp-reject" onclick="deleteReport(\'' + _esc(r.id) + '\')">삭제</button>' +
    '</div>';

    html += '</div>';
    return html;
  }).join('');
}

async function updateReport(id, status) {
  var noteEl = document.getElementById('rep-note-' + id);
  var note = noteEl ? noteEl.value.trim() : '';
  try {
    var res = await fetch(_WORKER_URL + '/admin/reports/update', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, _adminHeaders()),
      body: JSON.stringify({ id: id, status: status, admin_note: note })
    });
    var data = await res.json();
    if (!res.ok || !data.ok) { alert(data.error || '업데이트 실패'); return; }
    loadReports();
  } catch (e) {
    alert('네트워크 오류: ' + e.message);
  }
}

async function deleteReport(id) {
  if (!confirm('이 제보를 삭제할까요? 복구할 수 없습니다.')) return;
  try {
    var res = await fetch(_WORKER_URL + '/admin/reports/delete', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, _adminHeaders()),
      body: JSON.stringify({ id: id })
    });
    var data = await res.json();
    if (!res.ok || !data.ok) { alert(data.error || '삭제 실패'); return; }
    loadReports();
  } catch (e) {
    alert('네트워크 오류: ' + e.message);
  }
}

/* ══════════════════════════════════════
   후기게시판(review_board) 승인 관리
   ══════════════════════════════════════ */
var _rvbStatus = 'pending';
var _rvbItems = [];

function setReviewBoardStatus(status, btnEl) {
  _rvbStatus = status;
  document.querySelectorAll('#tab-review-board .sp-filter-btn').forEach(function(b) { b.classList.remove('on'); });
  if (btnEl) btnEl.classList.add('on');
  loadReviewBoard();
}

async function loadReviewBoard() {
  var container = document.getElementById('reviewBoardList');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;">불러오는 중...</div>';

  var params = new URLSearchParams();
  if (_rvbStatus) params.set('status', _rvbStatus);
  params.set('limit', '200');

  try {
    var res = await fetch(_WORKER_URL + '/admin/review-board/list?' + params.toString(), {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, _adminHeaders()),
      body: JSON.stringify({})
    });
    var data = await res.json();
    if (!res.ok || !data.ok) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#c00;">' + _esc(data.error || '조회 실패') + '</div>';
      return;
    }
    _rvbItems = data.items || [];
    renderReviewBoardCards(data.counts || {});
    renderReviewBoardList();
  } catch (e) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#c00;">네트워크 오류: ' + _esc(e.message) + '</div>';
  }
}

function renderReviewBoardCards(counts) {
  var cards = document.getElementById('reviewBoardCards');
  if (!cards) return;
  cards.innerHTML =
    '<div class="stat-card"><div class="stat-card-label">전체 후기</div><div class="stat-card-value">' + (counts.total || 0) + '</div></div>' +
    '<div class="stat-card"><div class="stat-card-label">대기중</div><div class="stat-card-value" style="color:#E65100;">' + (counts.pending || 0) + '</div></div>' +
    '<div class="stat-card"><div class="stat-card-label">승인완료</div><div class="stat-card-value" style="color:#2E7D32;">' + (counts.approved || 0) + '</div></div>' +
    '<div class="stat-card"><div class="stat-card-label">반려</div><div class="stat-card-value" style="color:#999;">' + (counts.rejected || 0) + '</div></div>';
}

function renderReviewBoardList() {
  var container = document.getElementById('reviewBoardList');
  if (!container) return;
  if (_rvbItems.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;">후기가 없습니다.</div>';
    return;
  }
  var STATUS_BADGE = {
    pending:  '<span class="sp-status pending">대기중</span>',
    approved: '<span class="sp-status approved">승인완료</span>',
    rejected: '<span class="sp-status rejected">반려</span>'
  };
  var CAT = { service:'서비스', editor:'유료 에디터', tool:'무료 도구', other:'기타' };

  container.innerHTML = _rvbItems.map(function(r) {
    var dateStr = r.created_at ? new Date(r.created_at).toLocaleString('ko-KR') : '';
    var html = '<div class="inquiry-card" style="padding:16px 20px;border-bottom:1px solid #f0f0f0;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
          (STATUS_BADGE[r.status] || '') +
          '<span style="font-size:11px;color:#666;background:#F5E4DB;padding:2px 8px;border-radius:5px;font-weight:600;">' + _esc(CAT[r.category] || r.category || '-') + '</span>' +
          '<span style="font-size:11px;color:#888;">작성자: ' + _esc(r.author_name || '익명') + '</span>' +
        '</div>' +
        '<span style="font-size:11px;color:#999;">' + _esc(dateStr) + '</span>' +
      '</div>' +
      '<div style="font-size:14px;font-weight:700;color:#0D0D0D;margin:8px 0 4px;">' + _esc(r.title || '') + '</div>' +
      '<div style="font-size:13px;color:#444;line-height:1.7;background:#fafafa;padding:10px;border-radius:6px;white-space:pre-wrap;">' + _esc(r.body || '') + '</div>';

    if (r.admin_note) {
      html += '<div style="font-size:11px;font-weight:700;color:#666;margin-top:8px;">관리자 메모</div>' +
        '<div style="font-size:13px;color:#333;background:#fff;border:1px solid #eee;padding:8px;border-radius:6px;">' + _esc(r.admin_note) + '</div>';
    }

    html += '<div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;align-items:center;">' +
      '<input type="text" id="rvb-note-' + _esc(r.id) + '" placeholder="반려 사유 / 메모 (선택)" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;font-family:inherit;" value="' + _esc(r.admin_note || '') + '">' +
      (r.status !== 'approved' ? '<button class="sp-action-btn sp-approve" onclick="updateReviewBoard(\'' + _esc(r.id) + '\',\'approved\')">승인</button>' : '') +
      (r.status !== 'rejected' ? '<button class="sp-action-btn" style="background:#999;color:#fff;" onclick="updateReviewBoard(\'' + _esc(r.id) + '\',\'rejected\')">반려</button>' : '') +
      (r.status !== 'pending' ? '<button class="sp-action-btn" style="background:#E65100;color:#fff;" onclick="updateReviewBoard(\'' + _esc(r.id) + '\',\'pending\')">대기로 되돌리기</button>' : '') +
      '<button class="sp-action-btn sp-reject" onclick="deleteReviewBoard(\'' + _esc(r.id) + '\')">삭제</button>' +
    '</div>';

    html += '</div>';
    return html;
  }).join('');
}

async function updateReviewBoard(id, status) {
  var noteEl = document.getElementById('rvb-note-' + id);
  var note = noteEl ? noteEl.value.trim() : '';
  try {
    var res = await fetch(_WORKER_URL + '/admin/review-board/update', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, _adminHeaders()),
      body: JSON.stringify({ id: id, status: status, admin_note: note })
    });
    var data = await res.json();
    if (!res.ok || !data.ok) { alert(data.error || '업데이트 실패'); return; }
    loadReviewBoard();
  } catch (e) {
    alert('네트워크 오류: ' + e.message);
  }
}

async function deleteReviewBoard(id) {
  if (!confirm('이 후기를 삭제할까요? 복구할 수 없습니다.')) return;
  try {
    var res = await fetch(_WORKER_URL + '/admin/review-board/delete', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, _adminHeaders()),
      body: JSON.stringify({ id: id })
    });
    var data = await res.json();
    if (!res.ok || !data.ok) { alert(data.error || '삭제 실패'); return; }
    loadReviewBoard();
  } catch (e) {
    alert('네트워크 오류: ' + e.message);
  }
}

/* ══════════════════════════════════════
   데모체험 사용자 목록 (admin/demo/list)
   ══════════════════════════════════════ */
var _demoSearchTimer = null;
function loadDemoUsersDebounced() {
  if (_demoSearchTimer) clearTimeout(_demoSearchTimer);
  _demoSearchTimer = setTimeout(loadDemoUsers, 300);
}

async function loadDemoUsers() {
  var tbody = document.getElementById('demoList');
  var cardsEl = document.getElementById('demoCards');
  var countEl = document.getElementById('demoCount');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#ccc;">불러오는 중...</td></tr>';

  var qInput = document.getElementById('demoSearch');
  var q = qInput ? (qInput.value || '').trim() : '';
  var params = new URLSearchParams();
  if (q) params.append('q', q);
  params.append('limit', '300');

  try {
    var res = await fetch(_WORKER_URL + '/admin/demo/list?' + params.toString(), {
      method: 'POST',
      headers: _adminHeaders(),
      body: JSON.stringify({})
    });
    var data = await res.json();
    if (!res.ok) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#c00;">' + _esc(data.error || '조회 실패') + '</td></tr>';
      return;
    }
    var items = data.items || [];
    var counts = data.counts || { total: 0, last24h: 0, last7d: 0 };

    if (cardsEl) {
      cardsEl.innerHTML =
        '<div class="stat-card"><div class="stat-label">전체 누적</div><div class="stat-value">' + counts.total + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">최근 24시간</div><div class="stat-value">' + counts.last24h + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">최근 7일</div><div class="stat-value">' + counts.last7d + '</div></div>';
    }
    if (countEl) countEl.textContent = '(' + items.length + '명 표시)';

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#ccc;">데모체험 사용자가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(function(r, i) {
      var actAt = r.activated_at ? new Date(r.activated_at).toLocaleString('ko-KR') : '-';
      var loginAt = r.last_login_at ? new Date(r.last_login_at).toLocaleString('ko-KR') : '-';
      var balance = (r.credit_balance != null) ? (Number(r.credit_balance).toLocaleString() + '文') : '-';
      var ip = r.ip || '-';
      var ref = r.referrer || '-';
      var utm = '';
      if (r.utm_source) utm += r.utm_source;
      if (r.utm_medium) utm += (utm ? ' / ' : '') + r.utm_medium;
      if (r.utm_campaign) utm += (utm ? ' / ' : '') + r.utm_campaign;
      if (!utm) utm = '-';
      var ua = r.user_agent || '-';
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td style="white-space:nowrap;">' + _esc(r.email || '-') + '</td>' +
        '<td style="white-space:nowrap;font-size:11px;color:#666;">' + _esc(actAt) + '</td>' +
        '<td style="white-space:nowrap;font-size:11px;color:#666;">' + _esc(loginAt) + '</td>' +
        '<td style="white-space:nowrap;">' + _esc(balance) + '</td>' +
        '<td style="white-space:nowrap;font-size:11px;">' + _esc(ip) + '</td>' +
        '<td style="font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;" title="' + _esc(ref) + '">' + _esc(ref) + '</td>' +
        '<td style="font-size:11px;">' + _esc(utm) + '</td>' +
        '<td style="font-size:10px;color:#888;max-width:300px;overflow:hidden;text-overflow:ellipsis;" title="' + _esc(ua) + '">' + _esc(ua) + '</td>' +
        '</tr>';
    }).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#c00;">네트워크 오류: ' + _esc(e.message) + '</td></tr>';
  }
}

/* ══════════════════════════════════════
   교정 예외 단어 (spacing_exceptions)
   ══════════════════════════════════════ */
var _spacingExcStatus = 'pending';
var _spacingExcItems = [];

function setSpacingExcStatus(status, btnEl) {
  _spacingExcStatus = status;
  document.querySelectorAll('#tab-spacing-exceptions .sp-filter-btn').forEach(function(b) { b.classList.remove('on'); });
  if (btnEl) btnEl.classList.add('on');
  loadSpacingExceptions();
}

async function loadSpacingExceptions() {
  var container = document.getElementById('spacingExcList');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;">불러오는 중...</div>';

  var params = new URLSearchParams();
  if (_spacingExcStatus) params.set('status', _spacingExcStatus);
  params.set('limit', '200');

  try {
    var headers = await _adminHeadersAsync();
    var res = await fetch(_WORKER_URL + '/admin/spacing-exceptions/list?' + params.toString(), {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
      body: JSON.stringify({})
    });
    var data = await res.json();
    if (!res.ok || !data.ok) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#c00;">' + _esc(data.error || '조회 실패') + '<br><span style="font-size:12px;color:#888;">「DB 초기화·시드」로 테이블을 만들거나 Supabase SQL Editor에서 migration-spacing-exceptions.sql 을 실행하세요.</span><br><button class="reply-btn" type="button" onclick="migrateSpacingExceptions()" style="margin-top:12px;background:#5D4037;color:#fff;">DB 초기화·시드</button></div>';
      return;
    }
    _spacingExcItems = data.items || [];
    renderSpacingExcCards(data.counts || {});
    renderSpacingExceptions();
  } catch (e) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#c00;">네트워크 오류: ' + _esc(e.message) + '</div>';
  }
}

function renderSpacingExcCards(counts) {
  var cards = document.getElementById('spacingExcCards');
  if (!cards) return;
  cards.innerHTML =
    '<div class="stat-card"><div class="stat-card-label">전체</div><div class="stat-card-value">' + (counts.total || 0) + '</div></div>' +
    '<div class="stat-card"><div class="stat-card-label">대기중</div><div class="stat-card-value" style="color:#E65100;">' + (counts.pending || 0) + '</div></div>' +
    '<div class="stat-card"><div class="stat-card-label">승인됨</div><div class="stat-card-value" style="color:#2E7D32;">' + (counts.approved || 0) + '</div></div>' +
    '<div class="stat-card"><div class="stat-card-label">반려</div><div class="stat-card-value" style="color:#999;">' + (counts.rejected || 0) + '</div></div>';
}

function renderSpacingExceptions() {
  var container = document.getElementById('spacingExcList');
  if (!container) return;
  if (_spacingExcItems.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;">등록된 예외 단어가 없습니다.</div>';
    return;
  }

  var STATUS_BADGE = {
    pending: '<span class="sp-status pending">대기중</span>',
    approved: '<span class="sp-status approved">승인됨</span>',
    rejected: '<span class="sp-status rejected">반려</span>'
  };

  container.innerHTML = _spacingExcItems.map(function(item) {
    var dateStr = item.created_at ? new Date(item.created_at).toLocaleString('ko-KR') : '';
    var word = item.word_form || (item.stem + '님');
    var html = '<div class="inquiry-card" style="padding:16px 20px;border-bottom:1px solid #f0f0f0;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
          (STATUS_BADGE[item.status] || '') +
          '<span style="font-size:18px;font-weight:800;color:#333;">' + _esc(word) + '</span>' +
          '<span style="font-size:11px;color:#888;">stem: ' + _esc(item.stem) + '</span>' +
        '</div>' +
        '<span style="font-size:11px;color:#999;">' + _esc(dateStr) + '</span>' +
      '</div>';
    if (item.note) html += '<div style="font-size:13px;color:#555;margin:8px 0;">' + _esc(item.note) + '</div>';
    if (item.admin_note) html += '<div style="font-size:12px;color:#888;margin:4px 0;">메모: ' + _esc(item.admin_note) + '</div>';
    html += '<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">';
    if (item.status === 'pending') {
      html += '<button class="sp-action-btn sp-approve" onclick="updateSpacingException(\'' + _esc(item.id) + '\',\'approved\')">승인</button>';
      html += '<button class="sp-action-btn sp-reject" onclick="updateSpacingException(\'' + _esc(item.id) + '\',\'rejected\')">반려</button>';
    }
    if (item.status !== 'pending') {
      html += '<button class="sp-action-btn" style="background:#E65100;color:#fff;" onclick="updateSpacingException(\'' + _esc(item.id) + '\',\'pending\')">대기로</button>';
    }
    html += '<button class="sp-action-btn sp-reject" onclick="deleteSpacingException(\'' + _esc(item.id) + '\')">삭제</button>';
    html += '</div></div>';
    return html;
  }).join('');
}

async function createSpacingException(autoApprove) {
  var wordEl = document.getElementById('spacingExcWord');
  var noteEl = document.getElementById('spacingExcNote');
  var word = wordEl ? wordEl.value.trim() : '';
  var note = noteEl ? noteEl.value.trim() : '';
  if (!word) { alert('단어를 입력해주세요. (예: 사장님)'); return; }

  try {
    var headers = await _adminHeadersAsync();
    var res = await fetch(_WORKER_URL + '/admin/spacing-exceptions/create', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
      body: JSON.stringify({ word: word, note: note, status: autoApprove ? 'approved' : 'pending' })
    });
    var data = await res.json();
    if (!res.ok || !data.ok) { alert(data.error || '등록 실패'); return; }
    if (wordEl) wordEl.value = '';
    if (noteEl) noteEl.value = '';
    alert(autoApprove ? '등록·승인되었습니다. 에디터에 즉시 반영됩니다.' : '등록되었습니다. 승인 대기 목록에서 확인하세요.');
    loadSpacingExceptions();
  } catch (e) {
    alert('네트워크 오류: ' + e.message);
  }
}

async function updateSpacingException(id, status) {
  try {
    var headers = await _adminHeadersAsync();
    var res = await fetch(_WORKER_URL + '/admin/spacing-exceptions/update', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
      body: JSON.stringify({ id: id, status: status })
    });
    var data = await res.json();
    if (!res.ok || !data.ok) { alert(data.error || '업데이트 실패'); return; }
    loadSpacingExceptions();
  } catch (e) {
    alert('네트워크 오류: ' + e.message);
  }
}

async function deleteSpacingException(id) {
  if (!confirm('이 예외 단어를 삭제할까요?')) return;
  try {
    var headers = await _adminHeadersAsync();
    var res = await fetch(_WORKER_URL + '/admin/spacing-exceptions/delete', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
      body: JSON.stringify({ id: id })
    });
    var data = await res.json();
    if (!res.ok || !data.ok) { alert(data.error || '삭제 실패'); return; }
    loadSpacingExceptions();
  } catch (e) {
    alert('네트워크 오류: ' + e.message);
  }
}

async function migrateSpacingExceptions() {
  if (!confirm('spacing_exceptions 테이블을 생성하고 기본 호칭어(사장·고객 등)를 시드합니다. 계속할까요?')) return;
  try {
    var headers = await _adminHeadersAsync();
    var res = await fetch(_WORKER_URL + '/admin/spacing-exceptions/migrate', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
      body: JSON.stringify({})
    });
    var data = await res.json();
    if (!res.ok || !data.ok) {
      alert((data.error || '마이그레이션 실패') + (data.mgmt && data.mgmt.body ? '\n' + data.mgmt.body : ''));
      return;
    }
    alert('완료: 승인된 예외 단어 ' + (data.stemsCount || 0) + '개');
    loadSpacingExceptions();
  } catch (e) {
    alert('네트워크 오류: ' + e.message);
  }
}

async function spacingExcFromReport(reportId, autoApprove) {
  try {
    var headers = await _adminHeadersAsync();
    var res = await fetch(_WORKER_URL + '/admin/spacing-exceptions/from-report', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
      body: JSON.stringify({ report_id: reportId, auto_approve: autoApprove })
    });
    var data = await res.json();
    if (!res.ok || !data.ok) { alert(data.error || '등록 실패'); return; }
    alert(autoApprove ? ('예외 단어가 승인되었습니다: ' + (data.stem || '') + '님') : '예외 등록 대기 목록에 추가되었습니다.');
    loadReports();
    if (document.getElementById('tab-spacing-exceptions').classList.contains('on')) loadSpacingExceptions();
  } catch (e) {
    alert('네트워크 오류: ' + e.message);
  }
}
