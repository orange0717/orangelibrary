// js/publish-review-admin.js
// 관리자 "출간 검토" 탭 — 작가의 출간 신청 글 미리보기 + 승인/거절
// 의존: window.supabase, window.OrangeMd, sql/migration-author-works-publish-review.sql 의 RPC

(function() {
  'use strict';

  var CAT_LABEL = { essay: '에세이', fiction: '소설', poem: '시', misc: '기타' };
  var _pendingCache = [];
  var _currentWork = null;

  // ────────────────────────────────────────────────
  // 목록 로드
  // ────────────────────────────────────────────────
  window.loadPendingPublishWorks = async function() {
    var listEl = document.getElementById('publishReviewList');
    if (!listEl) return;
    listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">불러오는 중...</div>';

    if (typeof supabase === 'undefined' || !supabase) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">Supabase 클라이언트 미연결</div>';
      return;
    }

    try {
      var res = await supabase.rpc('list_pending_publish_admin');
      if (res.error) throw res.error;
      var data = res.data || {};
      var rows = data.rows || [];
      _pendingCache = rows;
      updatePendingBadge();

      if (rows.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:40px;color:#bbb;font-size:13px;">검토 대기 중인 출간 신청이 없습니다.</div>';
        return;
      }

      listEl.innerHTML = '<table style="width:100%;font-size:13px;border-collapse:collapse;">' +
        '<thead><tr style="background:#FFF7F0;border-bottom:1px solid #FDE4CF;">' +
          '<th style="padding:10px;text-align:left;">제목</th>' +
          '<th style="padding:10px;text-align:left;">카테고리</th>' +
          '<th style="padding:10px;text-align:left;">작가</th>' +
          '<th style="padding:10px;text-align:left;">현재 상태</th>' +
          '<th style="padding:10px;text-align:right;">글자수</th>' +
          '<th style="padding:10px;text-align:left;">신청일</th>' +
          '<th style="padding:10px;text-align:right;"></th>' +
        '</tr></thead><tbody>' +
        rows.map(function(w) {
          var isFirst = w.author_current_status !== 'approved';
          var firstBadge = isFirst
            ? '<span style="font-size:10px;font-weight:700;background:#FFE9D6;color:#B8612A;padding:2px 8px;border-radius:50px;">첫 신청</span>'
            : '<span style="font-size:10px;font-weight:700;background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:50px;">기존 작가</span>';
          return '<tr style="border-bottom:1px solid #F2F2F2;">' +
            '<td style="padding:10px;font-weight:700;color:#0D0D0D;">' + escHtml(w.title) + '</td>' +
            '<td style="padding:10px;">' + escHtml(CAT_LABEL[w.category] || w.category) + '</td>' +
            '<td style="padding:10px;">' +
              '<strong>' + escHtml(w.author_name || '') + '</strong>' +
              '<div style="font-size:10px;color:#999;">' + escHtml(w.author_email || '') + '</div>' +
            '</td>' +
            '<td style="padding:10px;">' + firstBadge + '</td>' +
            '<td style="padding:10px;text-align:right;color:#999;">' + (w.char_count || 0).toLocaleString() + '자</td>' +
            '<td style="padding:10px;color:#999;">' + formatDate(w.updated_at) + '</td>' +
            '<td style="padding:10px;text-align:right;">' +
              '<button onclick="openPublishPreview(\'' + w.id + '\')" style="padding:6px 14px;background:#BF8C80;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">검토</button>' +
            '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>';
    } catch (e) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#C62828;font-size:13px;">로드 실패: ' + escHtml(e.message || '') + '</div>';
    }
  };

  function updatePendingBadge() {
    var badge = document.getElementById('publishReviewCount');
    if (!badge) return;
    var n = _pendingCache.length;
    if (n > 0) { badge.textContent = n; badge.style.display = ''; }
    else { badge.style.display = 'none'; }
  }

  // ────────────────────────────────────────────────
  // 미리보기 모달
  // ────────────────────────────────────────────────
  window.openPublishPreview = async function(workId) {
    try {
      var res = await supabase.rpc('get_pending_publish_work_admin', { p_work_id: workId });
      if (res.error) { alert('로드 실패: ' + res.error.message); return; }
      var data = res.data || {};
      if (!data.success) { alert('로드 실패: ' + data.error); return; }
      _currentWork = data.work;

      document.getElementById('ppmTitle').textContent = _currentWork.title;
      document.getElementById('ppmAuthor').innerHTML =
        '<strong>' + escHtml(_currentWork.author_name || '') + '</strong> · ' +
        escHtml(_currentWork.author_email || '') +
        (_currentWork.author_handle ? ' · /author/' + escHtml(_currentWork.author_handle) + '/' : '');
      document.getElementById('ppmMeta').innerHTML =
        '<span>카테고리: <strong>' + escHtml(CAT_LABEL[_currentWork.category] || _currentWork.category) + '</strong></span>' +
        '<span>slug: <strong style="font-family:monospace;">' + escHtml(_currentWork.slug) + '</strong></span>' +
        '<span>작성: ' + formatDate(_currentWork.created_at) + '</span>' +
        '<span>최종 수정: ' + formatDate(_currentWork.updated_at) + '</span>';

      var bodyEl = document.getElementById('ppmBody');
      if (window.OrangeMd) {
        bodyEl.innerHTML = window.OrangeMd.render(_currentWork.content || '');
      } else {
        bodyEl.textContent = _currentWork.content || '';
      }

      document.getElementById('publishPreviewModal').style.display = 'flex';
    } catch (e) {
      alert('오류: ' + e.message);
    }
  };

  window.closePublishPreviewModal = function() {
    document.getElementById('publishPreviewModal').style.display = 'none';
    _currentWork = null;
  };

  // ────────────────────────────────────────────────
  // 승인
  // ────────────────────────────────────────────────
  window.approvePublish = async function() {
    if (!_currentWork) return;
    if (!confirm('이 글을 발행 승인하시겠습니까?\n\n' + (_currentWork.author_name || '작가') + '님이 첫 발행이라면 작가 자격(author_status=approved)도 자동 부여됩니다.')) return;
    try {
      var res = await supabase.rpc('approve_publish_work', { p_work_id: _currentWork.id });
      if (res.error) { alert('승인 실패: ' + res.error.message); return; }
      var d = res.data || {};
      if (!d.success) { alert('승인 실패: ' + d.error); return; }
      var msg = '발행 승인 완료';
      if (d.first_author_approval) msg += '\n작가 자격도 자동 부여되었습니다.';
      alert(msg);
      closePublishPreviewModal();
      loadPendingPublishWorks();
    } catch (e) { alert('오류: ' + e.message); }
  };

  // ────────────────────────────────────────────────
  // 거절 (사유 모달)
  // ────────────────────────────────────────────────
  window.openRejectModal = function() {
    if (!_currentWork) return;
    document.getElementById('prmTarget').innerHTML =
      '<strong>' + escHtml(_currentWork.title) + '</strong> · ' + escHtml(_currentWork.author_name || '');
    document.getElementById('prmReason').value = '';
    document.getElementById('publishRejectModal').style.display = 'flex';
  };

  window.closeRejectModal = function() {
    document.getElementById('publishRejectModal').style.display = 'none';
  };

  window.confirmRejectPublish = async function() {
    if (!_currentWork) return;
    var reason = (document.getElementById('prmReason').value || '').trim();
    if (reason.length < 5) { alert('거절 사유를 5자 이상 작성해주세요.'); return; }
    try {
      var res = await supabase.rpc('reject_publish_work', { p_work_id: _currentWork.id, p_reason: reason });
      if (res.error) { alert('거절 실패: ' + res.error.message); return; }
      var d = res.data || {};
      if (!d.success) { alert('거절 실패: ' + d.error); return; }
      closeRejectModal();
      closePublishPreviewModal();
      loadPendingPublishWorks();
    } catch (e) { alert('오류: ' + e.message); }
  };

  // ────────────────────────────────────────────────
  // 사이드바 뱃지 — 페이지 진입 시 미리 카운트
  // ────────────────────────────────────────────────
  window.refreshPublishReviewBadge = async function() {
    if (typeof supabase === 'undefined' || !supabase) return;
    try {
      var res = await supabase.rpc('list_pending_publish_admin');
      if (res.error) return;
      var data = res.data || {};
      _pendingCache = data.rows || [];
      updatePendingBadge();
    } catch (e) {}
  };

  // ────────────────────────────────────────────────
  // 헬퍼
  // ────────────────────────────────────────────────
  function escHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function formatDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso); var pad = function(n) { return n < 10 ? '0' + n : n; };
      return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    } catch (e) { return iso; }
  }

  function init() {
    setTimeout(function() { window.refreshPublishReviewBadge(); }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
