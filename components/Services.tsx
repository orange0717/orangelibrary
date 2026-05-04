type Service = {
  num: string;
  tag: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  accent: string;
  highlight?: string;
};

const services: Service[] = [
  {
    num: "01",
    tag: "Naver Book Review",
    title: "네이버 도서리뷰 인플루언서",
    description:
      "네이버 도서 분야 공식 인플루언서로 활동하며, 신간·고전·세계문학을 깊이 있는 리뷰로 독자에게 전합니다.",
    cta: "인플루언서홈",
    href: "https://in.naver.com/orangelibrary",
    accent: "#03C75A",
  },
  {
    num: "02",
    tag: "World Literature Publishing",
    title: "제3세계 문학출판사",
    description:
      "한국에 잘 소개되지 않은 카자흐스탄·말레이시아·루마니아 문학을 직접 발굴·번역·출간합니다.",
    highlight: "2026년 첫 작품 출간 예정",
    cta: "YES24에서 보기",
    href: "https://www.yes24.com/product/search?domain=ALL&query=%EC%98%A4%EB%A0%8C%EC%A7%80%EB%8F%84%EC%84%9C%EA%B4%80",
    accent: "#7B1FA2",
  },
  {
    num: "03",
    tag: "AI Writing",
    title: "OrangeRefine",
    description:
      "AI 기반 한국어 교정·교열·윤문 플랫폼. 맞춤법 검사부터 AI 심층 피드백, 전자책 제작까지 글쓰기의 전 과정을 지원합니다.",
    cta: "바로가기",
    href: "https://orangerefine.kr",
    accent: "#F29C68",
  },
  {
    num: "04",
    tag: "Influencer Analytics",
    title: "N인플 프로그램",
    description:
      "네이버 인플루언서·블로거를 위한 데이터 분석 플랫폼. 키워드 순위 추적, 경쟁자 비교, 블루오션 발굴까지 한 번에.",
    cta: "바로가기",
    href: "https://naver-influencer.vercel.app",
    accent: "#1976D2",
  },
  {
    num: "05",
    tag: "Naver Power Content Ad",
    title: "파워콘텐츠 광고전문",
    description:
      "네이버 파워콘텐츠 제작부터 검색광고·디스플레이·쇼핑광고까지 원스톱으로. 7년 경력의 자매회사 주식회사 오렌지마케팅이 직접 운영합니다.",
    cta: "오렌지마케팅 바로가기",
    href: "https://orangemarketing.co.kr",
    accent: "#D32F2F",
  },
];

export default function Services() {
  return (
    <section id="services" className="relative bg-card py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex items-end justify-between gap-8 mb-14 md:mb-20">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-primary-dark uppercase">
              Services
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              5개 사업, 하나의 생태계
            </h2>
          </div>
          <p className="hidden max-w-sm text-sm leading-relaxed text-muted md:block">
            도서리뷰부터 출판·AI 글쓰기·데이터 분석·광고까지.<br />
            책을 둘러싼 모든 과정을 직접 운영합니다.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          {services.map((s, i) => {
            const featured = i === 0;
            return (
              <a
                key={s.num}
                href={s.href}
                target="_blank"
                rel="noopener"
                className={`group relative flex flex-col rounded-3xl border border-border/60 bg-background p-8 transition hover:-translate-y-1 hover:border-foreground/20 hover:shadow-xl hover:shadow-primary/5 md:p-10 ${
                  featured ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className="font-display text-xs font-semibold tracking-[0.2em] uppercase"
                        style={{ color: s.accent }}
                      >
                        {s.num}
                      </span>
                      <span
                        className="h-px w-8"
                        style={{ background: s.accent, opacity: 0.5 }}
                      />
                      <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-soft">
                        {s.tag}
                      </span>
                    </div>
                    <h3 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">
                      {s.title}
                    </h3>
                  </div>
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border/60 text-muted transition group-hover:border-transparent group-hover:text-white"
                    style={{
                      background: "transparent",
                    }}
                  >
                    <span
                      className="grid h-full w-full place-items-center rounded-full transition group-hover:bg-[var(--hover-bg)]"
                      style={
                        {
                          ["--hover-bg" as string]: s.accent,
                        } as React.CSSProperties
                      }
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition group-hover:rotate-[-45deg]"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </span>
                </div>

                <p className="mt-6 text-base leading-relaxed text-muted">
                  {s.description}
                </p>

                {s.highlight && (
                  <p
                    className="mt-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: `${s.accent}14`,
                      color: s.accent,
                    }}
                  >
                    ✦ {s.highlight}
                  </p>
                )}

                <div className="mt-auto pt-7">
                  <span
                    className="inline-flex items-center gap-2 text-sm font-semibold transition"
                    style={{ color: s.accent }}
                  >
                    {s.cta}
                    <span aria-hidden>→</span>
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
