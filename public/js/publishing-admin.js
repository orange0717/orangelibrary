/* ══════════════════════════════════════════════
   publishing-admin.js — 출판대행 검수 (관리자)
   목록·필터·상세 모달·상태 변경
   ══════════════════════════════════════════════ */
(function() {
  'use strict';

  var STATUS_LABEL = {
    submitted: '접수', under_review: '검토 중', contracted: '계약 체결',
    in_production: '제작 중', submitted_to_millie: '입점 진행',
    live: '서비스 중', settled: '정산 완료',
    rejected: '반려', cancelled: '취소', terminated: '계약 종료'
  };

  var FILE_FIELDS = [
    { col: 'manuscript_url', bucket: 'publishing-mss',     label: '원고' },
    { col: 'epub_url',       bucket: 'publishing-mss',     label: 'EPUB' },
    { col: 'cover_url',      bucket: 'publishing-covers',  label: '표지' },
    { col: 'id_doc_url',     bucket: 'publishing-id-docs', label: '신분증' },
    { col: 'bankbook_url',   bucket: 'publishing-id-docs', label: '통장' }
  ];

  var state = { filter: 'all', rows: [], current: null };

  function getSupabase() {
    if (window.SupaAuth && window.SupaAuth.client) return window.SupaAuth.client;
    if (window._supabaseClient) return window._supabaseClient;
    // admin/index.html 패턴: 글로벌 supabase 변수 (createClient 인스턴스)
    if (window.supabase && typeof window.supabase.from === 'function') return window.supabase;
    return null;
  }

  function getCurrentUser() {
    if (window.SupaAuth && typeof window.SupaAuth.getUser === 'function') {
      return window.SupaAuth.getUser();
    }
    try { var raw = localStorage.getItem('tr_user'); if (raw) return JSON.parse(raw); }
    catch (e) {}
    return null;
  }

  function htmlEsc(s) {
    var d = document.createElement('div');
    d.textContent = (s == null ? '' : String(s));
    return d.innerHTML;
  }

  function fmtDate(s) {
    if (!s) return '—';
    try {
      var d = new Date(s);
      return d.getFullYear() + '-' +
        String(d.getMonth()+1).padStart(2,'0') + '-' +
        String(d.getDate()).padStart(2,'0') + ' ' +
        String(d.getHours()).padStart(2,'0') + ':' +
        String(d.getMinutes()).padStart(2,'0');
    } catch (e) { return s; }
  }

  function fmtMoney(n) {
    if (n == null) return '—';
    return Number(n).toLocaleString() + '원';
  }

  /* ── 1. 진입 가드 ── */
  function checkAdmin() {
    var user = getCurrentUser();
    if (!user || !user.email || typeof window.isAdminEmail !== 'function' || !window.isAdminEmail(user.email)) {
      document.getElementById('pa-gate').style.display = 'block';
      document.getElementById('pa-main').style.display = 'none';
      return false;
    }
    document.getElementById('pa-gate').style.display = 'none';
    document.getElementById('pa-main').style.display = 'block';
    return true;
  }

  /* ── 2. 목록 로드 ── */
  async function loadList() {
    var supabase = getSupabase();
    if (!supabase) { setTimeout(loadList, 300); return; }
    var area = document.getElementById('pa-list-area');
    area.innerHTML = '<div class="pa-loading"><div class="spinner"></div><div style="margin-top:8px;">불러오는 중...</div></div>';

    try {
      var res = await supabase
        .from('publishing_requests')
        .select('id, title, subtitle, category, status, author_name, author_phone, author_email, submitted_at, contracted_at, live_at, rejected_reason, isbn')
        .order('submitted_at', { ascending: false });
      if (res.error) throw new Error(res.error.message || '조회 실패');
      state.rows = res.data || [];
      updateCounts();
      renderList();
    } catch (e) {
      console.error('[publishing-admin]', e);
      area.innerHTML = '<div class="pa-empty" style="color:#C62828;">목록 조회 실패: ' + htmlEsc(e.message) + '</div>';
    }
  }

  function updateCounts() {
    var counts = { all: state.rows.length, submitted: 0, under_review: 0, contracted: 0,
                   in_production: 0, submitted_to_millie: 0, live: 0, rejected: 0 };
    state.rows.forEach(function(r) {
      if (counts[r.status] != null) counts[r.status]++;
    });
    Object.keys(counts).forEach(function(k) {
      var el = document.getElementById('cnt-' + k);
      if (el) el.textContent = counts[k];
    });
  }

  function renderList() {
    var area = document.getElementById('pa-list-area');
    var rows = state.filter === 'all'
      ? state.rows
      : state.rows.filter(function(r) { return r.status === state.filter; });

    if (rows.length === 0) {
      area.innerHTML = '<div class="pa-empty">해당 상태의 신청이 없습니다.</div>';
      return;
    }

    var html = '<div class="pa-list">';
    rows.forEach(function(r) {
      var label = STATUS_LABEL[r.status] || r.status;
      html += '<div class="pa-item" data-id="' + htmlEsc(r.id) + '">';
      html += '<div class="pa-item-main">';
      html += '<div class="pa-item-title">' + htmlEsc(r.title || '제목 없음') + '</div>';
      html += '<div class="pa-item-meta">';
      html += '<span class="author">' + htmlEsc(r.author_name || '—') + '</span>';
      if (r.category) html += ' · ' + htmlEsc(r.category);
      if (r.isbn) html += ' · ISBN ' + htmlEsc(r.isbn);
      html += ' · 신청 ' + fmtDate(r.submitted_at);
      html += '</div></div>';
      html += '<div class="pa-item-side">';
      html += '<span class="pa-status ' + r.status + '">' + htmlEsc(label) + '</span>';
      html += '</div></div>';
    });
    html += '</div>';
    area.innerHTML = html;

    area.querySelectorAll('.pa-item').forEach(function(el) {
      el.addEventListener('click', function() {
        openDetail(el.dataset.id);
      });
    });
  }

  /* ── 3. 상세 모달 ── */
  async function openDetail(id) {
    var supabase = getSupabase();
    if (!supabase) return;
    var res = await supabase.from('publishing_requests').select('*').eq('id', id).single();
    if (res.error) { alert('상세 조회 실패: ' + res.error.message); return; }
    var r = res.data;
    state.current = r;

    document.getElementById('m-title').textContent = r.title || '제목 없음';
    document.getElementById('m-meta').innerHTML =
      '<span class="pa-status ' + r.status + '">' + htmlEsc(STATUS_LABEL[r.status] || r.status) + '</span>' +
      ' · 신청 ' + fmtDate(r.submitted_at);

    // 첨부 파일 signed URL
    var fileLinks = await Promise.all(FILE_FIELDS.map(async function(f) {
      var path = r[f.col];
      if (!path) return { f: f, url: null };
      var { data, error } = await supabase.storage.from(f.bucket).createSignedUrl(path, 3600);
      return { f: f, url: error ? null : data.signedUrl, error: error };
    }));

    var fileHtml = '<div class="pa-files">';
    var hasAny = false;
    fileLinks.forEach(function(x) {
      if (x.url) {
        hasAny = true;
        fileHtml += '<a href="' + htmlEsc(x.url) + '" target="_blank" rel="noopener">📎 ' + htmlEsc(x.f.label) + ' 다운로드</a>';
      }
    });
    if (!hasAny) fileHtml += '<span class="none">첨부 파일 없음</span>';
    fileHtml += '</div>';

    var rejectedHtml = r.status === 'rejected' && r.rejected_reason
      ? '<div style="margin-top:14px;padding:12px;background:#FFEBEE;border-radius:8px;color:#C62828;font-size:13px;line-height:1.6;"><strong>반려 사유</strong><br>' + htmlEsc(r.rejected_reason) + '</div>'
      : '';

    document.getElementById('m-body').innerHTML =
      '<div class="pa-section-h">책 정보</div>' +
      '<dl class="pa-kv">' +
        kv('도서명', r.title) +
        kv('부제명', r.subtitle) +
        kv('분야', r.category) +
        kv('콘텐츠', r.content_type) +
        kv('나이 제한', r.age_limit === 'adult' ? '성인용' : '전 연령') +
        kv('ISBN', r.isbn) +
        kv('정가', r.ebook_price ? fmtMoney(r.ebook_price) : null) +
        kv('출간일', r.publish_date) +
        kv('키워드', r.keywords) +
        kv('도서 소개', r.description) +
        kv('저자 소개', r.author_bio) +
        kv('목차', r.toc_text) +
      '</dl>' +
      '<div class="pa-section-h">작가 정보</div>' +
      '<dl class="pa-kv">' +
        kv('성명', r.author_name) +
        kv('생년월일', r.author_birth) +
        kv('주소', r.author_address) +
        kv('휴대전화', r.author_phone) +
        kv('이메일', r.author_email) +
        kv('SMS 인증', r.phone_verified ? '✓ ' + fmtDate(r.phone_verified_at) : '미인증') +
      '</dl>' +
      '<div class="pa-section-h">정산 계좌</div>' +
      '<dl class="pa-kv">' +
        kv('은행', r.bank_name) +
        kv('계좌번호', r.account_number) +
        kv('예금주', r.account_holder) +
      '</dl>' +
      '<div class="pa-section-h">2차 콘텐츠 동의</div>' +
      '<dl class="pa-kv">' +
        kv('숏폼·3분 리뷰', r.secondary_shortform_consent ? '✓ 가능' : '불가') +
        kv('오디오북·드라마', r.secondary_audio_consent ? '✓ 가능' : '불가') +
        kv('챗북', r.secondary_chatbook_consent ? '✓ 가능' : '불가') +
      '</dl>' +
      '<div class="pa-section-h">첨부 파일</div>' + fileHtml +
      rejectedHtml +
      '<div class="pa-reject-input" id="m-reject-input">' +
        '<div style="font-size:12px;font-weight:700;color:#C62828;margin-bottom:8px;">반려 사유</div>' +
        '<textarea id="m-reject-reason" placeholder="작가에게 전달될 반려 사유를 입력해 주세요"></textarea>' +
      '</div>';

    // 액션 버튼
    var actions = '';
    if (r.status === 'submitted' || r.status === 'under_review') {
      if (r.status === 'submitted') actions += '<button class="btn" onclick="window._paAdmin.changeStatus(\'under_review\')">검토 시작</button>';
      actions += '<button class="btn primary" onclick="window._paAdmin.changeStatus(\'contracted\')">출간 결정 (계약 체결)</button>';
      actions += '<button class="btn danger" onclick="window._paAdmin.askReject()">반려</button>';
    } else if (r.status === 'contracted') {
      actions += '<a class="btn" href="/ebook/maker/?request_id=' + encodeURIComponent(r.id) + '" target="_blank" style="text-decoration:none;display:inline-flex;align-items:center;">📖 북디자인 시작</a>';
      actions += '<button class="btn primary" onclick="window._paAdmin.changeStatus(\'in_production\')">제작 시작</button>';
    } else if (r.status === 'in_production') {
      actions += '<a class="btn" href="/ebook/maker/?request_id=' + encodeURIComponent(r.id) + '" target="_blank" style="text-decoration:none;display:inline-flex;align-items:center;">📖 북디자인 계속</a>';
      actions += '<button class="btn primary" onclick="window._paAdmin.changeStatus(\'submitted_to_millie\')">입점 진행</button>';
    } else if (r.status === 'submitted_to_millie') {
      actions += '<a class="btn" href="/ebook/maker/?request_id=' + encodeURIComponent(r.id) + '" target="_blank" style="text-decoration:none;display:inline-flex;align-items:center;">📖 북디자인 보기</a>';
      actions += '<button class="btn primary" onclick="window._paAdmin.changeStatus(\'live\')">서비스 시작 (live)</button>';
    } else if (r.status === 'live' || r.status === 'settled') {
      actions += '<a class="btn" href="/ebook/maker/?request_id=' + encodeURIComponent(r.id) + '" target="_blank" style="text-decoration:none;display:inline-flex;align-items:center;">📖 북디자인 보기</a>';
    }
    actions += '<button class="btn" onclick="closeModal()">닫기</button>';
    document.getElementById('m-actions').innerHTML = actions;

    document.getElementById('pa-modal').classList.add('show');
  }

  function kv(label, value) {
    if (value == null || value === '') return '';
    return '<dt>' + htmlEsc(label) + '</dt><dd>' + htmlEsc(value) + '</dd>';
  }

  function closeModal() {
    document.getElementById('pa-modal').classList.remove('show');
    state.current = null;
  }
  window.closeModal = closeModal;

  /* ── 4. 상태 변경 ── */
  async function changeStatus(newStatus) {
    if (!state.current) return;
    var supabase = getSupabase();
    var user = getCurrentUser();
    var patch = { status: newStatus };
    var nowIso = new Date().toISOString();
    if (newStatus === 'under_review') { patch.reviewed_by = user.email; patch.reviewed_at = nowIso; }
    if (newStatus === 'contracted') patch.contracted_at = nowIso;
    if (newStatus === 'in_production') patch.in_production_at = nowIso;
    if (newStatus === 'submitted_to_millie') patch.submitted_to_millie_at = nowIso;
    if (newStatus === 'live') patch.live_at = nowIso;
    if (newStatus === 'rejected') {
      var reason = (document.getElementById('m-reject-reason').value || '').trim();
      if (!reason) { alert('반려 사유를 입력해 주세요.'); return; }
      patch.rejected_at = nowIso;
      patch.rejected_reason = reason;
    }

    try {
      var res = await supabase.from('publishing_requests').update(patch).eq('id', state.current.id);
      if (res.error) throw new Error(res.error.message);
      closeModal();
      await loadList();
    } catch (e) {
      alert('상태 변경 실패: ' + e.message);
    }
  }

  function askReject() {
    var box = document.getElementById('m-reject-input');
    if (box) box.style.display = 'block';
    // 한 번 더 클릭하면 실제 반려 진행
    var btn = event && event.target;
    if (btn && btn.tagName === 'BUTTON') {
      btn.textContent = '반려 확정';
      btn.onclick = function() { changeStatus('rejected'); };
    }
  }

  window._paAdmin = { changeStatus: changeStatus, askReject: askReject };

  /* ── 5. 필터 + 새로고침 ── */
  function bindFilter() {
    document.getElementById('pa-filter').addEventListener('click', function(e) {
      var chip = e.target.closest('.pa-chip');
      if (!chip) return;
      state.filter = chip.dataset.status;
      document.querySelectorAll('.pa-chip').forEach(function(c) { c.classList.remove('on'); });
      chip.classList.add('on');
      renderList();
    });
    document.getElementById('pa-refresh').addEventListener('click', loadList);
  }

  /* ── init ── */
  var _bound = false;
  function init(opts) {
    opts = opts || {};
    // admin/index.html 진입 시(skipGate)는 admin 가드 페이지 자체 통과한 상태
    if (!opts.skipGate) {
      if (typeof window.isAdminEmail !== 'function') {
        setTimeout(function() { init(opts); }, 200); return;
      }
      if (!checkAdmin()) {
        setTimeout(function() {
          if (checkAdmin()) { bindOnce(); loadList(); }
        }, 1500);
        return;
      }
    }
    bindOnce();
    loadList();
  }

  function bindOnce() {
    if (_bound) return;
    if (document.getElementById('pa-filter') && document.getElementById('pa-refresh')) {
      bindFilter();
      _bound = true;
    }
  }

  // 글로벌 export — admin/index.html setAdminTab('publishing')에서 호출
  window.initPublishingAdmin = init;

  // 자동 진입은 /admin/publishing/ 단독 페이지에서만 (admin/index.html에서는 setAdminTab이 호출)
  if (location.pathname.indexOf('/admin/publishing') === 0) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { init(); });
    } else {
      init();
    }
  }
})();
