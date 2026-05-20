// js/author-admin.js
// 관리자 "작가 신청" 탭 — 일반/별도 심사 큐 + 승인/거절
// 의존: window.supabase, sql/migration-author-platform.sql 의 RPC
//   list_pending_authors(p_special)  — true|false|null
//   approve_author(p_user_id)
//   reject_author(p_user_id, p_reason)

(function() {
  'use strict';

  var _filter = 'all'; // 'all' | 'normal' | 'special'
  var _pendingCache = [];

  // ────────────────────────────────────────────────
  // 탭 필터 토글
  // ────────────────────────────────────────────────

  window.setAuthorAdminTab = function(filter) {
    _filter = filter;
    document.querySelectorAll('.author-admin-tab').forEach(function(el) {
      var on = el.dataset.filter === filter;
      el.classList.toggle('on', on);
      el.style.background = on ? '#BF8C80' : '#fff';
      el.style.color = on ? '#fff' : '#555';
      el.style.border = on ? 'none' : '1px solid #E6D4CC';
      el.style.fontWeight = on ? '700' : '400';
    });
    loadAuthorApplications(filter);
  };

  // ────────────────────────────────────────────────
  // 목록 로드
  // ────────────────────────────────────────────────

  window.loadAuthorApplications = async function(filter) {
    if (filter) _filter = filter;
    var listEl = document.getElementById('authorAdminList');
    if (!listEl) return;
    listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">불러오는 중...</div>';

    if (typeof supabase === 'undefined' || !supabase) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">Supabase 클라이언트 미연결</div>';
      return;
    }

    var pSpecial = null;
    if (_filter === 'normal') pSpecial = false;
    else if (_filter === 'special') pSpecial = true;

    try {
      var res = await supabase.rpc('list_pending_authors', { p_special: pSpecial });
      if (res.error) throw res.error;
      var data = res.data || {};
      if (!data.success) {
        listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#C62828;font-size:13px;">권한 없음 또는 RPC 오류</div>';
        return;
      }
      _pendingCache = data.rows || [];
      renderAuthorAdminList(_pendingCache);
      updatePendingBadge();
    } catch (e) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#C62828;font-size:13px;">로드 실패: ' + escapeHtml(e.message || '') + '</div>';
    }
  };

  function updatePendingBadge() {
    var badge = document.getElementById('authorPendingCount');
    if (!badge) return;
    var n = _pendingCache.length;
    if (n > 0) {
      badge.textContent = n;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  // ────────────────────────────────────────────────
  // 렌더링
  // ────────────────────────────────────────────────

  function renderAuthorAdminList(rows) {
    var listEl = document.getElementById('authorAdminList');
    if (!listEl) return;
    if (!rows || rows.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:40px;color:#bbb;font-size:13px;">대기 중인 신청이 없습니다.</div>';
      return;
    }

    listEl.innerHTML = rows.map(function(r) {
      var special = r.author_status === 'pending_special';
      var social = r.social_links || {};
      var socialHtml = ['blog', 'instagram', 'twitter']
        .filter(function(k) { return social[k]; })
        .map(function(k) { return '<a href="' + escapeHtml(social[k]) + '" target="_blank" rel="noopener" style="color:#1565C0;font-size:12px;text-decoration:none;margin-right:10px;">' + k + ' →</a>'; })
        .join('');

      return '' +
        '<div style="background:#fff;border:1px solid ' + (special ? '#FDE4CF' : '#F5E4DB') + ';border-radius:12px;padding:16px 18px;margin-bottom:12px;">' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">' +
            '<span style="font-size:14px;font-weight:800;color:#0D0D0D;">' + escapeHtml(r.display_name || '(이름 없음)') + '</span>' +
            '<span style="font-size:11px;color:#999;">' + escapeHtml(r.email || '') + '</span>' +
            (special
              ? '<span style="font-size:10px;font-weight:700;background:#FFE9D6;color:#B8612A;padding:2px 8px;border-radius:50px;">별도 심사</span>'
              : '<span style="font-size:10px;font-weight:700;background:#FFF7F0;color:#B8612A;padding:2px 8px;border-radius:50px;">일반 심사</span>') +
            '<span style="margin-left:auto;font-size:11px;color:#bbb;">' + formatDate(r.author_applied_at) + '</span>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:12px;color:#666;line-height:1.7;margin-bottom:10px;">' +
            '<span style="color:#999;">핸들</span><span><strong style="color:#0D0D0D;">/author/' + escapeHtml(r.handle || '') + '/</strong></span>' +
            '<span style="color:#999;">장르</span><span>' + escapeHtml(r.author_genre || '') + '</span>' +
            '<span style="color:#999;">자기소개</span><span style="white-space:pre-wrap;">' + escapeHtml(r.author_bio || '(없음)') + '</span>' +
            (socialHtml ? '<span style="color:#999;">소셜</span><span>' + socialHtml + '</span>' : '') +
          '</div>' +
          '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
            '<button onclick="approveAuthorApplication(\'' + r.user_id + '\', \'' + escapeAttr(r.display_name || '') + '\')" style="padding:7px 16px;background:#2E7D32;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">승인</button>' +
            '<button onclick="openAuthorRejectModal(\'' + r.user_id + '\', \'' + escapeAttr(r.display_name || '') + '\', \'' + escapeAttr(r.handle || '') + '\')" style="padding:7px 16px;background:#fff;color:#d32f2f;border:1px solid #d32f2f;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">거절</button>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  // ────────────────────────────────────────────────
  // 승인
  // ────────────────────────────────────────────────

  window.approveAuthorApplication = async function(userId, displayName) {
    if (!confirm((displayName || '신청자') + ' 작가 승인하시겠습니까?')) return;
    try {
      var res = await supabase.rpc('approve_author', { p_user_id: userId });
      if (res.error) { alert('승인 실패: ' + res.error.message); return; }
      var d = res.data || {};
      if (!d.success) { alert('승인 실패: ' + (d.error || 'unknown')); return; }
      loadAuthorApplications(_filter);
    } catch (e) {
      alert('오류: ' + e.message);
    }
  };

  // ────────────────────────────────────────────────
  // 거절 모달
  // ────────────────────────────────────────────────

  var _rejectTarget = null;

  window.openAuthorRejectModal = function(userId, displayName, handle) {
    _rejectTarget = { userId: userId, displayName: displayName, handle: handle };
    document.getElementById('authorRejectTarget').innerHTML =
      '<strong style="color:#0D0D0D;">' + escapeHtml(displayName || '') + '</strong> · /author/' + escapeHtml(handle || '') + '/';
    document.getElementById('authorRejectReason').value = '';
    document.getElementById('authorRejectModal').style.display = 'flex';
  };

  window.closeAuthorRejectModal = function() {
    document.getElementById('authorRejectModal').style.display = 'none';
    _rejectTarget = null;
  };

  window.confirmAuthorReject = async function() {
    if (!_rejectTarget) return;
    var reason = (document.getElementById('authorRejectReason').value || '').trim();
    if (reason.length < 5) { alert('거절 사유를 5자 이상 작성해주세요.'); return; }
    var btn = document.getElementById('authorRejectConfirmBtn');
    btn.disabled = true; btn.textContent = '처리 중...';
    try {
      var res = await supabase.rpc('reject_author', { p_user_id: _rejectTarget.userId, p_reason: reason });
      if (res.error) { alert('거절 실패: ' + res.error.message); return; }
      var d = res.data || {};
      if (!d.success) { alert('거절 실패: ' + (d.error || 'unknown')); return; }
      closeAuthorRejectModal();
      loadAuthorApplications(_filter);
    } catch (e) {
      alert('오류: ' + e.message);
    } finally {
      btn.disabled = false; btn.textContent = '거절하기';
    }
  };

  // ────────────────────────────────────────────────
  // 사이드바 뱃지 — 페이지 진입 시 한 번 미리 조회
  // ────────────────────────────────────────────────

  window.refreshAuthorPendingBadge = async function() {
    if (typeof supabase === 'undefined' || !supabase) return;
    try {
      var res = await supabase.rpc('list_pending_authors', { p_special: null });
      if (res.error) return;
      var data = res.data || {};
      if (!data.success) return;
      _pendingCache = data.rows || [];
      updatePendingBadge();
    } catch (e) {}
  };

  // ────────────────────────────────────────────────
  // 헬퍼
  // ────────────────────────────────────────────────

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  }
  function formatDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      var pad = function(n) { return n < 10 ? '0' + n : n; };
      return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    } catch (e) { return iso; }
  }

  // ────────────────────────────────────────────────
  // 부트스트랩 — 사이드바 뱃지 미리 조회
  // ────────────────────────────────────────────────

  function init() {
    setTimeout(function() { window.refreshAuthorPendingBadge(); }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
