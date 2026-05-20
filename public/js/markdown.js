// js/markdown.js
// 의존성 없는 경량 마크다운 → HTML 렌더러 (XSS-safe)
// 사용: window.OrangeMd.render(text) → HTML 문자열
// 지원: 헤딩(#~####), 볼드(**), 이탤릭(*), 인라인 코드(`), 코드블록(```),
//       인용(>), 순서/비순서 리스트, 링크 [text](url), 이미지 ![alt](url),
//       구분선(---), 단락(빈 줄), 자동 줄바꿈(<br>)

(function(global) {
  'use strict';

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // URL 안전 필터 (javascript: data: 차단)
  function safeUrl(url) {
    var s = String(url || '').trim();
    if (/^(javascript|data|vbscript):/i.test(s)) return '#';
    return s;
  }

  // 인라인 변환: 코드 → 이미지 → 링크 → 볼드 → 이탤릭 순서
  function renderInline(text) {
    // 인라인 코드 `code` (먼저 추출해서 자리표시자로 보호)
    var codes = [];
    text = text.replace(/`([^`\n]+)`/g, function(_, c) {
      codes.push('<code>' + c + '</code>');
      return 'CODE' + (codes.length - 1) + '';
    });

    // 이미지 ![alt](url)
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
      function(_, alt, url, title) {
        var t = title ? ' title="' + title + '"' : '';
        return '<img src="' + safeUrl(url) + '" alt="' + alt + '"' + t + ' loading="lazy" style="max-width:100%;height:auto;border-radius:8px;margin:12px 0;">';
      });

    // 링크 [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
      function(_, label, url, title) {
        var t = title ? ' title="' + title + '"' : '';
        return '<a href="' + safeUrl(url) + '"' + t + ' target="_blank" rel="noopener noreferrer">' + label + '</a>';
      });

    // 볼드 **text** / __text__
    text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');

    // 이탤릭 *text* / _text_  (볼드 다음에 처리)
    text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    text = text.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');

    // 자리표시자 복원
    text = text.replace(/CODE(\d+)/g, function(_, i) { return codes[+i]; });
    return text;
  }

  function render(src) {
    if (src == null) return '';
    var raw = String(src).replace(/\r\n?/g, '\n');

    // 1단계: 코드블록 추출 (보호)
    var blocks = [];
    raw = raw.replace(/```([\w-]*)\n([\s\S]*?)```/g, function(_, lang, code) {
      blocks.push('<pre><code' + (lang ? ' class="lang-' + escapeHtml(lang) + '"' : '') + '>' + escapeHtml(code) + '</code></pre>');
      return 'BLOCK' + (blocks.length - 1) + '';
    });

    // 2단계: HTML escape (이후 변환은 안전한 마크업만 추가)
    raw = escapeHtml(raw);

    var lines = raw.split('\n');
    var out = [];
    var para = [];
    var listType = null;     // 'ul' | 'ol' | null
    var inQuote = false;

    function flushPara() {
      if (para.length === 0) return;
      var html = renderInline(para.join('\n'));
      // 단락 내 줄바꿈은 <br>
      out.push('<p>' + html.replace(/\n/g, '<br>') + '</p>');
      para = [];
    }
    function closeList() {
      if (listType) { out.push('</' + listType + '>'); listType = null; }
    }
    function closeQuote() {
      if (inQuote) { out.push('</blockquote>'); inQuote = false; }
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // 자리표시자 라인 (코드블록): 단독 단락으로
      if (/^\s*BLOCK\d+\s*$/.test(line)) {
        flushPara(); closeList(); closeQuote();
        out.push(line.trim());
        continue;
      }

      // 빈 줄
      if (/^\s*$/.test(line)) {
        flushPara(); closeList(); closeQuote();
        continue;
      }

      // 구분선 ---
      if (/^\s*---+\s*$/.test(line)) {
        flushPara(); closeList(); closeQuote();
        out.push('<hr>');
        continue;
      }

      // 헤딩 # ~ ####
      var h = line.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);
      if (h) {
        flushPara(); closeList(); closeQuote();
        var lv = h[1].length;
        out.push('<h' + lv + '>' + renderInline(h[2]) + '</h' + lv + '>');
        continue;
      }

      // 인용 > ...
      var q = line.match(/^\s*&gt;\s?(.*)$/);
      if (q) {
        flushPara(); closeList();
        if (!inQuote) { out.push('<blockquote>'); inQuote = true; }
        out.push('<p>' + renderInline(q[1]) + '</p>');
        continue;
      }

      // 비순서 리스트 - / *
      var ul = line.match(/^\s*[-*]\s+(.+)$/);
      if (ul) {
        flushPara(); closeQuote();
        if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
        out.push('<li>' + renderInline(ul[1]) + '</li>');
        continue;
      }

      // 순서 리스트 1. 2. ...
      var ol = line.match(/^\s*\d+\.\s+(.+)$/);
      if (ol) {
        flushPara(); closeQuote();
        if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
        out.push('<li>' + renderInline(ol[1]) + '</li>');
        continue;
      }

      // 일반 단락
      closeList(); closeQuote();
      para.push(line);
    }

    flushPara(); closeList(); closeQuote();

    var html = out.join('\n');

    // 코드블록 자리표시자 복원
    html = html.replace(/BLOCK(\d+)/g, function(_, i) { return blocks[+i]; });
    return html;
  }

  global.OrangeMd = { render: render, escapeHtml: escapeHtml };
})(window);
