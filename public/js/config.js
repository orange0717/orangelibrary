/**
 * config.js — OrangeLibrary 설정 파일
 *
 * ★ 이 파일만 수정하면 사이트 내용이 바뀝니다 ★
 *
 * 수정 방법:
 *   1. 이 파일을 텍스트 에디터(메모장, VS Code 등)로 열기
 *   2. 바꾸고 싶은 텍스트를 수정
 *   3. 저장 후 브라우저 새로고침 (Ctrl+Shift+R 또는 Cmd+Shift+R)
 *
 * 주의:
 *   - 따옴표('') 안의 내용만 수정하세요
 *   - 따옴표를 지우면 에러가 납니다
 *   - 줄바꿈은 <br>로 표시합니다
 */

const CONFIG = {

  // ══════════════════════════════════
  //  기본 정보
  // ══════════════════════════════════
  siteName: 'OrangeLibrary',
  siteTitle: '오렌지도서관 - 맞춤법, 교정 교열 | OrangeLibrary',
  siteDescription: '글쓰기 실력을 한 단계 올려드립니다. 교정·교열·윤문, 표절체크, 맞춤법 퀴즈까지 올인원 한국어 글쓰기 플랫폼',

  // ══════════════════════════════════
  //  링크
  // ══════════════════════════════════
  buyMeCoffeeUrl: 'https://buymeacoffee.com/orangelibrary',
  smartStoreUrl: '',  // 스마트스토어 링크 (빈 칸이면 숨김)

  // ══════════════════════════════════
  //  서비스 소개 페이지 — 히어로
  // ══════════════════════════════════
  heroTitle: 'AI가 사람 대신 글을 쓰는 시대,<br>당신은 Cognitive Debt(인지적 빚)을 지고 사시겠습니까?',
  heroSubtitle: '당신의 사유하는 힘을 함께 지켜드립니다.<br>좋은 글은 창의적인 생각, 경험에서 시작됩니다.',
  heroDesc: '',
  heroButton: '지금 바로 써보기 →',

  // ══════════════════════════════════
  //  서비스 소개 — 추천 대상
  // ══════════════════════════════════
  targets: [
    { title: 'SNS 크리에이터', desc: '블로그, 인스타그램, 유튜브 자막 등 매일 글을 쓰는 크리에이터' },
    { title: '협찬 · 체험단 블로거', desc: '브랜드 원고 납품 전 맞춤법과 문장력을 한 번에 점검하고 싶은 분' },
    { title: '마케팅 에이전시', desc: '인플루언서 원고를 대량으로 검수해야 하는 마케팅 담당자' },
    { title: '글쓰기를 잘하고 싶은 누구나', desc: '자기소개서, 보고서, 이메일 등 정확한 한국어가 필요한 모든 분' },
  ],

  // ══════════════════════════════════
  //  서비스 소개 — 핵심 메시지
  // ══════════════════════════════════
  whyTitle: '세상을 바꾸는 힘은 사유하는 힘에서 나온다.',
  whyItems: [
    { emoji: '', title: 'AI가 쓴 글도 틀린다', desc: 'ChatGPT도 "되"와 "돼", "로서"와 "로써"를 자주 틀립니다. AI 글도 교정이 필요합니다.' },
    { emoji: '', title: 'AI 글 티가 난다', desc: '"또한", "나아가" 같은 AI 특유 표현. AI탐지 기능으로 미리 확인하세요.' },
    { emoji: '', title: '사유하는 힘을 지킨다', desc: '글쓰기는 생각을 정리하는 과정입니다. AI에 맡기면 결과물만 남고, 내 머릿속엔 아무것도 남지 않습니다.' },
    { emoji: '', title: '체계적 3단계 교정', desc: '교정 · 교열 · 윤문. 맞춤법부터 문장 흐름까지 체계적으로 다듬어 드립니다.' },
  ],

  // ══════════════════════════════════
  //  서비스 소개 — 개발 로드맵
  // ══════════════════════════════════
  roadmap: [
    'AI 문맥 교정 엔진 (Claude API 연동)',
    '회원 가입 및 교정 이력 저장',
    '브랜드 맞춤 가이드라인 관리',
    'DOCX/PDF 원본 서식 유지 내보내기',
    '팀 협업 기능 (공유 워크스페이스)',
    'AI 작성 탐지 시스템',
    '광고 카피 학습 (패러프레이징 연습)',
    '공무원 국어 학습 모드',
  ],

  // ══════════════════════════════════
  //  후원 정보
  // ══════════════════════════════════
  donateTitle: '후원으로 만들어가는 서비스',
  donateSubtitle: '여러분의 후원이 더 똑똑한 교정 서비스를 만듭니다',
  donateBenefits: [
    '후원해 주신 분께 <b style="color:#BF8C80;">365일 무료 이용권</b>을 드립니다.',
    '<b style="color:#BF8C80;">오렌지도서관 후원자 명단</b>에 등재됩니다.',
    '기부금영수증 발행 가능.',
  ],
  donateUsage: ['인건비', '서버비', '마케팅비', '사업 확장'],

  // ══════════════════════════════════
  //  사업자 정보
  // ══════════════════════════════════
  bizName: '오렌지도서관',
  bizCeo: '한미선',
  bizNumber: '702-62-00986',
  bizSalesNumber: '2026-충남아산-0325',
  bizAddress: '충청남도 아산시 탕정면 탕정면로 22번길 15-12 301호',
  bizPhone: '0507-1394-5091',

  // ══════════════════════════════════
  //  관리자 설정 (해시 기반 — 이메일 노출 방지)
  // ══════════════════════════════════
  _adminHashes: [961386141, 1031997614],
};


/**
 * 설정을 페이지에 적용하는 함수
 * (페이지 로드 시 자동 실행)
 */
function applyConfig() {
  const C = CONFIG;

  // 페이지 타이틀
  document.title = C.siteTitle;

  // Buy Me a Coffee 링크 업데이트
  document.querySelectorAll('a[href*="buymeacoffee"]').forEach(a => {
    a.href = C.buyMeCoffeeUrl;
  });

  // ── 서비스 소개 페이지 ──
  const aboutPage = document.getElementById('page-about');
  if (!aboutPage) return;

  // 히어로 섹션
  const heroEl = aboutPage.querySelector('[data-cfg="hero-title"]');
  if (heroEl) heroEl.innerHTML = C.heroTitle;

  const heroSub = aboutPage.querySelector('[data-cfg="hero-subtitle"]');
  if (heroSub) heroSub.innerHTML = C.heroSubtitle;

  const heroDesc = aboutPage.querySelector('[data-cfg="hero-desc"]');
  if (heroDesc) heroDesc.textContent = C.heroDesc;

  const heroBtn = aboutPage.querySelector('[data-cfg="hero-btn"]');
  if (heroBtn) heroBtn.textContent = C.heroButton;

  // 추천 대상
  const targetEls = aboutPage.querySelectorAll('[data-cfg="target"]');
  targetEls.forEach((el, i) => {
    if (C.targets[i]) {
      const titleEl = el.querySelector('[data-cfg="target-title"]');
      const descEl = el.querySelector('[data-cfg="target-desc"]');
      if (titleEl) titleEl.textContent = C.targets[i].title;
      if (descEl) descEl.textContent = C.targets[i].desc;
    }
  });

  // 핵심 메시지 (why) 섹션
  const whyTitle = aboutPage.querySelector('[data-cfg="why-title"]');
  if (whyTitle) whyTitle.textContent = C.whyTitle;

  const whyEls = aboutPage.querySelectorAll('[data-cfg="why-item"]');
  whyEls.forEach((el, i) => {
    if (C.whyItems[i]) {
      const emoji = el.querySelector('[data-cfg="why-emoji"]');
      const title = el.querySelector('[data-cfg="why-item-title"]');
      const desc = el.querySelector('[data-cfg="why-item-desc"]');
      if (emoji) emoji.textContent = C.whyItems[i].emoji;
      if (title) title.textContent = C.whyItems[i].title;
      if (desc) desc.textContent = C.whyItems[i].desc;
    }
  });

  // 로드맵
  const rmContainer = aboutPage.querySelector('[data-cfg="roadmap"]');
  if (rmContainer) {
    rmContainer.innerHTML = C.roadmap.map((item, i) =>
      '<div style="display:flex;align-items:center;gap:6px;"><span style="color:#BF8C80;font-weight:800;">' +
      String(i + 1).padStart(2, '0') + '</span> ' + esc(item) + '</div>'
    ).join('');
  }

  // 후원 정보
  const donTitle = aboutPage.querySelector('[data-cfg="donate-title"]');
  if (donTitle) donTitle.textContent = C.donateTitle;
  const donSub = aboutPage.querySelector('[data-cfg="donate-subtitle"]');
  if (donSub) donSub.textContent = C.donateSubtitle;

  const benefitsEl = aboutPage.querySelector('[data-cfg="donate-benefits"]');
  if (benefitsEl) {
    // donateBenefits는 개발자가 관리하는 설정이므로 HTML 허용 (신뢰된 소스)
    benefitsEl.innerHTML = C.donateBenefits.map(b => '· ' + b).join('<br>');
  }

  const usageEl = aboutPage.querySelector('[data-cfg="donate-usage"]');
  if (usageEl) {
    usageEl.innerHTML = C.donateUsage.map(u =>
      '<span style="background:#fff;border:1px solid #D9B7B0;border-radius:8px;padding:6px 12px;">' + esc(u) + '</span>'
    ).join('');
  }

  // 사업자 정보
  const bizEls = document.querySelectorAll('[data-cfg="biz-info"]');
  bizEls.forEach(el => {
    el.innerHTML = '상호 : ' + esc(C.bizName) + ' &nbsp;|&nbsp; 대표 : ' + esc(C.bizCeo) +
      '<br>사업자등록번호 : ' + esc(C.bizNumber) + ' &nbsp;|&nbsp; 통신판매번호 : ' + esc(C.bizSalesNumber) +
      '<br>주소 : ' + esc(C.bizAddress) + ' &nbsp;|&nbsp; 전화 : ' + esc(C.bizPhone);
  });
}
