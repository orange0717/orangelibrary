// js/payout-admin.js
// 관리자 "출간 정산" 탭 — 책 등록, CSV 업로드, 정산 명세서
// 의존: window.supabase + sql/migration-payout.sql RPC

(function() {
  'use strict';

  var CHANNEL_LABEL = { millie: '밀리', ridi: '리디', kyobo: '교보', aladin: '알라딘', other: '기타' };
  var _csvParsedRows = null;       // CSV 미리보기 후 확정 시 사용
  var _editingBookId = null;
  var _paidPayoutId = null;
  var _initialized = false;

  // ────────────────────────────────────────────────
  // 부트스트랩 (탭 진입 시 1회 + 매번 책 목록 새로고침)
  // ────────────────────────────────────────────────
  window.initPayoutAdmin = function() {
    if (!_initialized) {
      // 기본값: 전월
      var now = new Date();
      var prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      document.getElementById('csvYear').value = prev.getFullYear();
      document.getElementById('csvMonth').value = prev.getMonth() + 1;
      document.getElementById('poYear').value = prev.getFullYear();
      document.getElementById('poMonth').value = prev.getMonth() + 1;
      _initialized = true;
    }
    setPayoutTab('books');
  };

  window.setPayoutTab = function(sub) {
    document.querySelectorAll('.payout-tab').forEach(function(el) {
      var on = el.dataset.sub === sub;
      el.classList.toggle('on', on);
      el.style.background = on ? '#BF8C80' : '#fff';
      el.style.color = on ? '#fff' : '#555';
      el.style.border = on ? 'none' : '1px solid #E6D4CC';
      el.style.fontWeight = on ? '700' : '400';
    });
    document.getElementById('payout-sub-books').style.display = sub === 'books' ? '' : 'none';
    document.getElementById('payout-sub-import').style.display = sub === 'import' ? '' : 'none';
    document.getElementById('payout-sub-payouts').style.display = sub === 'payouts' ? '' : 'none';
    if (sub === 'books') loadBooks();
  };

  // ────────────────────────────────────────────────
  // 책 목록
  // ────────────────────────────────────────────────
  async function loadBooks() {
    var listEl = document.getElementById('payoutBooksList');
    listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">불러오는 중...</div>';
    try {
      var res = await supabase.rpc('list_books_admin');
      if (res.error) throw res.error;
      var data = res.data || {};
      var rows = data.rows || [];
      if (rows.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:40px;color:#bbb;font-size:13px;">등록된 책이 없습니다. 우상단 "+ 책 등록" 으로 추가하세요.</div>';
        return;
      }
      listEl.innerHTML = '<table style="width:100%;font-size:12px;border-collapse:collapse;">' +
        '<thead><tr style="background:#FFF7F0;border-bottom:1px solid #FDE4CF;">' +
          '<th style="padding:8px 10px;text-align:left;">제목</th>' +
          '<th style="padding:8px 10px;text-align:left;">ISBN</th>' +
          '<th style="padding:8px 10px;text-align:left;">작가</th>' +
          '<th style="padding:8px 10px;text-align:left;">채널</th>' +
          '<th style="padding:8px 10px;text-align:right;">인세율</th>' +
          '<th style="padding:8px 10px;text-align:left;">출간일</th>' +
          '<th style="padding:8px 10px;text-align:right;">관리</th>' +
        '</tr></thead><tbody>' +
        rows.map(function(b) {
          return '<tr style="border-bottom:1px solid #F2F2F2;">' +
            '<td style="padding:8px 10px;font-weight:600;color:#0D0D0D;">' + escHtml(b.title) + '</td>' +
            '<td style="padding:8px 10px;font-family:monospace;color:#666;">' + escHtml(b.isbn || '-') + '</td>' +
            '<td style="padding:8px 10px;">' + escHtml(b.author_name || '') + '<div style="font-size:10px;color:#999;">' + escHtml(b.author_email || '') + '</div></td>' +
            '<td style="padding:8px 10px;">' + (CHANNEL_LABEL[b.channel] || b.channel) + '</td>' +
            '<td style="padding:8px 10px;text-align:right;">' + Math.round(b.royalty_rate_author * 100) + '% / ' + Math.round(b.royalty_rate_platform * 100) + '%</td>' +
            '<td style="padding:8px 10px;color:#999;">' + (b.published_at || '-') + '</td>' +
            '<td style="padding:8px 10px;text-align:right;">' +
              '<button onclick="editBook(\'' + b.id + '\')" style="padding:4px 10px;background:#fff;color:#666;border:1px solid #D9B7B0;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;margin-right:4px;">수정</button>' +
              (b.status === 'active' ? '<button onclick="archiveBook(\'' + b.id + '\')" style="padding:4px 10px;background:#fff;color:#d32f2f;border:1px solid #FFCDD2;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;">보관</button>' : '<span style="font-size:10px;color:#999;">보관됨</span>') +
            '</td>' +
          '</tr>';
        }).join('') + '</tbody></table>';
      _booksCache = rows;
    } catch (e) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#C62828;font-size:13px;">로드 실패: ' + escHtml(e.message || '') + '</div>';
    }
  }

  var _booksCache = [];

  // ────────────────────────────────────────────────
  // 책 등록/수정 모달
  // ────────────────────────────────────────────────
  window.openBookModal = function() {
    _editingBookId = null;
    document.getElementById('bookModalTitle').textContent = '책 등록';
    ['bm-title','bm-isbn','bm-author-email','bm-author-uid','bm-cover','bm-published'].forEach(function(id){ document.getElementById(id).value = ''; });
    document.getElementById('bm-channel').value = 'millie';
    document.getElementById('bm-rate').value = '0.7';
    document.getElementById('bm-author-result').textContent = '';
    document.getElementById('bm-error').style.display = 'none';
    document.getElementById('bookModal').style.display = 'flex';
  };

  window.editBook = function(bookId) {
    var b = _booksCache.find(function(x){ return x.id === bookId; });
    if (!b) return;
    _editingBookId = bookId;
    document.getElementById('bookModalTitle').textContent = '책 수정';
    document.getElementById('bm-title').value = b.title || '';
    document.getElementById('bm-isbn').value = b.isbn || '';
    document.getElementById('bm-channel').value = b.channel || 'millie';
    document.getElementById('bm-rate').value = b.royalty_rate_author || 0.7;
    document.getElementById('bm-published').value = b.published_at || '';
    document.getElementById('bm-cover').value = b.cover_url || '';
    document.getElementById('bm-author-email').value = b.author_email || '';
    document.getElementById('bm-author-uid').value = b.author_user_id || '';
    document.getElementById('bm-author-result').textContent = b.author_name ? '✓ ' + b.author_name : '';
    document.getElementById('bm-error').style.display = 'none';
    document.getElementById('bookModal').style.display = 'flex';
  };

  window.closeBookModal = function() {
    document.getElementById('bookModal').style.display = 'none';
  };

  // 작가 이메일 → user_id 검색 (debounce)
  var _searchTimer = null;
  window.searchAuthorByEmail = function(email) {
    if (_searchTimer) clearTimeout(_searchTimer);
    var resultEl = document.getElementById('bm-author-result');
    document.getElementById('bm-author-uid').value = '';
    if (!email || email.length < 3) { resultEl.textContent = ''; return; }
    _searchTimer = setTimeout(async function() {
      try {
        var res = await supabase.from('profiles')
          .select('id, display_name, email, author_status')
          .eq('email', email.trim())
          .maybeSingle();
        if (res.error || !res.data) {
          resultEl.style.color = '#d32f2f';
          resultEl.textContent = '✗ 회원을 찾을 수 없습니다.';
          return;
        }
        document.getElementById('bm-author-uid').value = res.data.id;
        resultEl.style.color = res.data.author_status === 'approved' ? '#2E7D32' : '#B8612A';
        resultEl.textContent = (res.data.author_status === 'approved' ? '✓ ' : '⚠ 승인 안 됨 - ') + (res.data.display_name || '') + ' (' + res.data.email + ')';
      } catch (e) {
        resultEl.style.color = '#d32f2f';
        resultEl.textContent = '✗ ' + e.message;
      }
    }, 400);
  };

  window.saveBook = async function() {
    var errEl = document.getElementById('bm-error');
    errEl.style.display = 'none';
    var title = (document.getElementById('bm-title').value || '').trim();
    var isbn = (document.getElementById('bm-isbn').value || '').trim();
    var channel = document.getElementById('bm-channel').value;
    var uid = document.getElementById('bm-author-uid').value;
    var rate = parseFloat(document.getElementById('bm-rate').value);
    var published = document.getElementById('bm-published').value || null;
    var cover = (document.getElementById('bm-cover').value || '').trim();

    if (!title) { showBmErr('제목을 입력해주세요.'); return; }
    if (!uid) { showBmErr('작가를 이메일로 검색·선택해주세요.'); return; }
    if (isNaN(rate) || rate < 0 || rate > 1) { showBmErr('인세율은 0~1 사이.'); return; }

    var btn = document.getElementById('bm-save-btn');
    btn.disabled = true; var orig = btn.textContent; btn.textContent = '저장 중...';
    try {
      var res = await supabase.rpc('upsert_book', {
        p_book_id: _editingBookId,
        p_isbn: isbn || null,
        p_title: title,
        p_cover_url: cover || null,
        p_channel: channel,
        p_author_user_id: uid,
        p_royalty_rate_author: rate,
        p_published_at: published
      });
      if (res.error) { showBmErr(res.error.message); return; }
      var d = res.data || {};
      if (!d.success) { showBmErr(d.error || 'unknown'); return; }
      closeBookModal();
      loadBooks();
    } catch (e) {
      showBmErr(e.message);
    } finally {
      btn.disabled = false; btn.textContent = orig;
    }
  };

  function showBmErr(msg) {
    var el = document.getElementById('bm-error');
    el.textContent = msg; el.style.display = '';
  }

  window.archiveBook = async function(bookId) {
    if (!confirm('이 책을 보관 처리하시겠습니까? CSV 매칭에서 제외되며 작가 페이지에서도 숨겨집니다.')) return;
    try {
      var res = await supabase.rpc('archive_book', { p_book_id: bookId });
      if (res.error) { alert('실패: ' + res.error.message); return; }
      loadBooks();
    } catch (e) { alert('오류: ' + e.message); }
  };

  // ────────────────────────────────────────────────
  // CSV 파일 → 미리보기
  // ────────────────────────────────────────────────
  window.onCsvFile = function(input) {
    var f = input.files && input.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var rows = parseCsv(e.target.result);
        renderCsvPreview(rows, f.name);
      } catch (err) {
        alert('CSV 파싱 실패: ' + err.message);
      }
    };
    reader.readAsText(f, 'UTF-8');
  };

  function parseCsv(text) {
    // 단순 파서 (따옴표 둘러싼 필드 + 콤마/개행). 모든 행 객체로.
    var lines = text.replace(/\r\n?/g, '\n').split('\n').filter(function(l) { return l.trim().length > 0; });
    if (lines.length === 0) throw new Error('빈 파일');
    var header = splitCsvLine(lines[0]).map(function(h) { return h.trim().toLowerCase(); });
    var idxIsbn = header.indexOf('isbn');
    var idxTitle = header.indexOf('title');
    var idxAmt = header.indexOf('gross_amount_krw');
    if (idxAmt < 0) idxAmt = header.indexOf('amount');
    if (idxIsbn < 0 || idxAmt < 0) throw new Error('헤더에 isbn, gross_amount_krw 컬럼이 필요합니다.');

    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      var cells = splitCsvLine(lines[i]);
      if (cells.length === 0) continue;
      var amt = parseInt(String(cells[idxAmt] || '').replace(/[, ]/g, ''), 10);
      if (isNaN(amt)) amt = 0;
      rows.push({
        isbn: (cells[idxIsbn] || '').trim(),
        title: idxTitle >= 0 ? (cells[idxTitle] || '').trim() : '',
        gross_amount_krw: amt
      });
    }
    return rows;
  }

  function splitCsvLine(line) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (c === '"') { if (q && line[i+1] === '"') { cur += '"'; i++; } else { q = !q; } }
      else if (c === ',' && !q) { out.push(cur); cur = ''; }
      else { cur += c; }
    }
    out.push(cur);
    return out;
  }

  function renderCsvPreview(rows, filename) {
    _csvParsedRows = rows;
    var preview = document.getElementById('csvPreview');
    var tbody = document.getElementById('csvPreviewRows');
    var summary = document.getElementById('csvPreviewSummary');
    var total = rows.reduce(function(s, r) { return s + (r.gross_amount_krw || 0); }, 0);
    summary.textContent = '총 ' + rows.length + '행, 합계 ' + total.toLocaleString() + '원 — ' + filename;
    tbody.innerHTML = rows.slice(0, 50).map(function(r) {
      return '<tr style="border-bottom:1px solid #F2F2F2;">' +
        '<td style="padding:5px 10px;font-family:monospace;">' + escHtml(r.isbn) + '</td>' +
        '<td style="padding:5px 10px;">' + escHtml(r.title) + '</td>' +
        '<td style="padding:5px 10px;text-align:right;">' + (r.gross_amount_krw || 0).toLocaleString() + '</td>' +
      '</tr>';
    }).join('') + (rows.length > 50 ? '<tr><td colspan="3" style="padding:6px;text-align:center;color:#999;">... 이하 ' + (rows.length - 50) + '행 생략</td></tr>' : '');
    preview.style.display = '';
    document.getElementById('csvResult').style.display = 'none';
  }

  window.confirmCsvImport = async function() {
    if (!_csvParsedRows || _csvParsedRows.length === 0) { alert('CSV 파일을 먼저 선택해주세요.'); return; }
    var year = parseInt(document.getElementById('csvYear').value, 10);
    var month = parseInt(document.getElementById('csvMonth').value, 10);
    var channel = document.getElementById('csvChannel').value;
    var fileEl = document.getElementById('csvFile');
    var filename = fileEl.files && fileEl.files[0] ? fileEl.files[0].name : '';
    if (!year || !month) { alert('연/월을 입력해주세요.'); return; }
    if (!confirm(year + '년 ' + month + '월 인세 ' + _csvParsedRows.length + '행을 업로드합니다.\n같은 (책, 월) 이 이미 있으면 덮어씁니다. 진행할까요?')) return;

    var btn = document.getElementById('csvConfirmBtn');
    btn.disabled = true; btn.textContent = '업로드 중...';
    try {
      var res = await supabase.rpc('import_royalty_csv', {
        p_year: year,
        p_month: month,
        p_channel: channel,
        p_filename: filename,
        p_rows: _csvParsedRows
      });
      if (res.error) { alert('업로드 실패: ' + res.error.message); return; }
      var d = res.data || {};
      if (!d.success) { alert('실패: ' + d.error); return; }

      var resEl = document.getElementById('csvResult');
      resEl.style.display = '';
      resEl.innerHTML =
        '<div style="font-size:13px;font-weight:700;color:#2E7D32;margin-bottom:8px;">✓ 업로드 완료</div>' +
        '<div style="font-size:12px;color:#666;line-height:1.7;">' +
          '매칭됨: <strong>' + d.matched + '건</strong><br>' +
          '미매칭: <strong style="color:' + (d.unmatched > 0 ? '#d32f2f' : '#2E7D32') + ';">' + d.unmatched + '건</strong><br>' +
          '총 인세: <strong>' + (d.total_amount_krw || 0).toLocaleString() + '원</strong>' +
        '</div>' +
        (d.unmatched > 0 ?
          '<div style="margin-top:10px;background:#FFF3F3;border:1px solid #FFCDD2;border-radius:8px;padding:10px;font-size:12px;">' +
            '<strong style="color:#d32f2f;">미매칭 ISBN (책 등록 후 재업로드 필요):</strong><br>' +
            (d.unmatched_rows || []).map(function(r) {
              return '<div style="margin-top:4px;">· ' + escHtml(r.isbn || '(공란)') + ' — ' + escHtml(r.title || '') + ' (' + (r.amount || 0).toLocaleString() + '원)</div>';
            }).join('') +
          '</div>'
          : '') +
        '<div style="margin-top:12px;"><button onclick="setPayoutTab(\'payouts\')" style="padding:8px 14px;background:#BF8C80;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">정산 명세서로 →</button></div>';
    } catch (e) {
      alert('오류: ' + e.message);
    } finally {
      btn.disabled = false; btn.textContent = '업로드 확정';
    }
  };

  // ────────────────────────────────────────────────
  // 정산 명세서 (recompute + 목록 + 송금 마킹)
  // ────────────────────────────────────────────────
  window.recomputePayouts = async function() {
    var year = parseInt(document.getElementById('poYear').value, 10);
    var month = parseInt(document.getElementById('poMonth').value, 10);
    if (!year || !month) { alert('연/월을 입력해주세요.'); return; }
    if (!confirm(year + '년 ' + month + '월 정산을 재계산합니다.\n이미 송금완료된 명세서는 변경되지 않습니다. 진행할까요?')) return;
    try {
      var res = await supabase.rpc('recompute_payouts', { p_year: year, p_month: month });
      if (res.error) { alert('실패: ' + res.error.message); return; }
      var d = res.data || {};
      if (!d.success) { alert('실패'); return; }
      alert('재계산 완료\n작가 ' + d.authors_count + '명, 실송금 합계 ' + (d.total_net_krw || 0).toLocaleString() + '원');
      loadPayouts();
    } catch (e) { alert('오류: ' + e.message); }
  };

  window.loadPayouts = async function() {
    var year = parseInt(document.getElementById('poYear').value, 10);
    var month = parseInt(document.getElementById('poMonth').value, 10);
    var listEl = document.getElementById('payoutsList');
    if (!year || !month) { listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">연/월을 입력해주세요.</div>'; return; }
    listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">불러오는 중...</div>';
    try {
      var res = await supabase.rpc('list_payouts_admin', { p_year: year, p_month: month });
      if (res.error) throw res.error;
      var data = res.data || {};
      var rows = data.rows || [];
      if (rows.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#bbb;font-size:13px;">' + year + '년 ' + month + '월 정산 명세서가 없습니다. "정산 재계산"을 먼저 누르세요.</div>';
        return;
      }
      var totalSubtotal = rows.reduce(function(s, r) { return s + (r.subtotal_krw || 0); }, 0);
      var totalNet = rows.reduce(function(s, r) { return s + (r.net_krw || 0); }, 0);

      listEl.innerHTML =
        '<div style="background:#FFF7F0;border-radius:10px;padding:10px 14px;margin-bottom:10px;font-size:12px;color:#666;">' +
          year + '년 ' + month + '월: 작가 <strong>' + rows.length + '명</strong>, 작가 몫 합계 <strong>' + totalSubtotal.toLocaleString() + '원</strong>, 실송금 합계 <strong style="color:#B8612A;">' + totalNet.toLocaleString() + '원</strong>' +
        '</div>' +
        '<table style="width:100%;font-size:12px;border-collapse:collapse;">' +
          '<thead><tr style="background:#fff;border-bottom:1px solid #FDE4CF;">' +
            '<th style="padding:8px 10px;text-align:left;">작가</th>' +
            '<th style="padding:8px 10px;text-align:right;">작가 몫</th>' +
            '<th style="padding:8px 10px;text-align:right;">원천징수</th>' +
            '<th style="padding:8px 10px;text-align:right;">실 송금액</th>' +
            '<th style="padding:8px 10px;text-align:left;">계좌</th>' +
            '<th style="padding:8px 10px;text-align:left;">상태</th>' +
            '<th style="padding:8px 10px;text-align:right;">관리</th>' +
          '</tr></thead><tbody>' +
          rows.map(function(r) {
            var bank = r.bank_name && r.bank_account_number
              ? r.bank_name + ' ' + maskAccount(r.bank_account_number) + (r.account_holder ? ' · ' + r.account_holder : '')
              : '<span style="color:#d32f2f;">미등록</span>';
            var statusBadge = r.status === 'paid'
              ? '<span style="font-size:10px;font-weight:700;background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:50px;">송금완료</span>'
              : '<span style="font-size:10px;font-weight:700;background:#FFF7F0;color:#B8612A;padding:2px 8px;border-radius:50px;">대기</span>';
            return '<tr style="border-bottom:1px solid #F2F2F2;">' +
              '<td style="padding:8px 10px;"><strong>' + escHtml(r.display_name || '') + '</strong><div style="font-size:10px;color:#999;">' + escHtml(r.email || '') + '</div></td>' +
              '<td style="padding:8px 10px;text-align:right;">' + (r.subtotal_krw || 0).toLocaleString() + '</td>' +
              '<td style="padding:8px 10px;text-align:right;color:#999;">−' + (r.withholding_krw || 0).toLocaleString() + ' (' + Math.round((r.tax_rate_snapshot || 0.033) * 1000) / 10 + '%)</td>' +
              '<td style="padding:8px 10px;text-align:right;font-weight:700;color:#B8612A;">' + (r.net_krw || 0).toLocaleString() + '</td>' +
              '<td style="padding:8px 10px;font-size:11px;">' + bank + '</td>' +
              '<td style="padding:8px 10px;">' + statusBadge + (r.paid_at ? '<div style="font-size:10px;color:#999;">' + formatDate(r.paid_at) + '</div>' : '') + '</td>' +
              '<td style="padding:8px 10px;text-align:right;">' +
                (r.status === 'paid'
                  ? '<span style="font-size:10px;color:#999;">완료</span>'
                  : '<button onclick="openPaidModal(\'' + r.id + '\', \'' + escAttr(r.display_name || '') + '\', ' + (r.net_krw || 0) + ')" style="padding:4px 10px;background:#2E7D32;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">송금완료</button>') +
              '</td>' +
            '</tr>';
          }).join('') +
        '</tbody></table>';
    } catch (e) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#C62828;font-size:13px;">로드 실패: ' + escHtml(e.message || '') + '</div>';
    }
  };

  // ────────────────────────────────────────────────
  // 송금 마킹 모달
  // ────────────────────────────────────────────────
  window.openPaidModal = function(payoutId, displayName, netKrw) {
    _paidPayoutId = payoutId;
    document.getElementById('paidTarget').innerHTML = '<strong style="color:#0D0D0D;">' + escHtml(displayName) + '</strong> · 실 송금액 <strong style="color:#B8612A;">' + (netKrw || 0).toLocaleString() + '원</strong>';
    document.getElementById('paidMemo').value = '';
    document.getElementById('paidModal').style.display = 'flex';
  };
  window.closePaidModal = function() {
    document.getElementById('paidModal').style.display = 'none';
    _paidPayoutId = null;
  };
  window.confirmPaid = async function() {
    if (!_paidPayoutId) return;
    var memo = (document.getElementById('paidMemo').value || '').trim();
    try {
      var res = await supabase.rpc('mark_payout_paid', { p_payout_id: _paidPayoutId, p_memo: memo });
      if (res.error) { alert('실패: ' + res.error.message); return; }
      var d = res.data || {};
      if (!d.success) { alert('실패: ' + d.error); return; }
      closePaidModal();
      loadPayouts();
    } catch (e) { alert('오류: ' + e.message); }
  };

  // ────────────────────────────────────────────────
  // 헬퍼
  // ────────────────────────────────────────────────
  function escHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escAttr(s) {
    return String(s == null ? '' : s).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  }
  function maskAccount(n) {
    var s = String(n || '');
    if (s.length < 6) return s;
    return s.slice(0, 3) + '***' + s.slice(-3);
  }
  function formatDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso); var pad = function(n) { return n < 10 ? '0' + n : n; };
      return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    } catch (e) { return iso; }
  }
})();
