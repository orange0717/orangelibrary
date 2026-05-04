type Service = {
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  href: string;
  note?: string;
};

const services: Service[] = [
  {
    title: "네이버 도서리뷰 인플루언서",
    subtitle: "공식 인플루언서 활동",
    description:
      "네이버 도서 분야 공식 인플루언서로 활동하며, 신간·고전·세계문학을 깊이 있는 리뷰로 독자에게 전합니다.",
    cta: "인플루언서홈 가기",
    href: "https://in.naver.com/orangelibrary",
  },
  {
    title: "제3세계 문학 출판",
    subtitle: "직접 발굴·번역·출간",
    description:
      "한국에 잘 소개되지 않은 카자흐스탄·말레이시아·루마니아 문학을 직접 발굴해 출간합니다.",
    note: "2026년 첫 작품 출간 예정",
    cta: "YES24에서 보기",
    href: "https://www.yes24.com/product/search?domain=ALL&query=%EC%98%A4%EB%A0%8C%EC%A7%80%EB%8F%84%EC%84%9C%EA%B4%80",
  },
  {
    title: "OrangeRefine",
    subtitle: "AI 한국어 교정 플랫폼",
    description:
      "AI 기반 한국어 교정·교열·윤문 도구. 맞춤법 검사부터 AI 심층 피드백, 전자책 제작까지 글쓰기의 전 과정을 지원합니다.",
    cta: "사이트 바로가기",
    href: "https://orangerefine.kr",
  },
  {
    title: "N인플",
    subtitle: "인플루언서 데이터 분석",
    description:
      "네이버 인플루언서·블로거를 위한 데이터 분석 플랫폼. 키워드 순위 추적, 경쟁자 비교, 블루오션 발굴까지 한 번에.",
    cta: "사이트 바로가기",
    href: "https://naver-influencer.vercel.app",
  },
  {
    title: "파워콘텐츠 광고",
    subtitle: "원스톱 광고 대행",
    description:
      "네이버 파워콘텐츠 제작부터 검색·디스플레이·쇼핑광고까지. 7년 경력의 자매회사 주식회사 오렌지마케팅이 직접 운영합니다.",
    cta: "오렌지마케팅 가기",
    href: "https://orangemarketing.co.kr",
  },
];

export default function Services() {
  return (
    <section id="services" className="bg-surface px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-[1.5px] text-primary">
            Services
          </p>
          <h2 className="mt-3 font-serif text-[28px] font-extrabold tracking-tight md:text-[36px]">
            5개 사업, 하나의 생태계
          </h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-muted">
            도서리뷰부터 출판·AI 글쓰기·데이터 분석·광고까지 책을 둘러싼 전 과정을 운영합니다.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <a
              key={s.title}
              href={s.href}
              target="_blank"
              rel="noopener"
              className="group flex flex-col rounded-[14px] border border-border-strong/60 bg-surface p-7 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_6px_24px_rgba(191,140,128,0.12)]"
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-primary">
                {s.subtitle}
              </p>
              <h3 className="mt-2 font-serif text-[20px] font-bold tracking-tight md:text-[22px]">
                {s.title}
              </h3>
              <p className="mt-4 flex-1 text-[14px] leading-[1.75] text-muted">
                {s.description}
              </p>
              {s.note && (
                <p className="mt-4 inline-flex w-fit rounded-full bg-primary-soft px-3 py-1 text-[12px] font-semibold text-primary-dark">
                  ✦ {s.note}
                </p>
              )}
              <p className="mt-6 inline-flex items-center text-[13px] font-bold text-primary">
                {s.cta}
                <span aria-hidden className="ml-1.5 transition group-hover:translate-x-1">→</span>
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
