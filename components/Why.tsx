const points = [
  {
    num: "01",
    title: "현직 도서리뷰 인플루언서",
    body:
      "네이버 공식 도서리뷰 인플루언서로서 매일 책을 읽고 쓰는 사람이 직접 출판·서비스를 기획·운영합니다.",
  },
  {
    num: "02",
    title: "제3세계 문학 직접 발굴",
    body:
      "카자흐스탄·말레이시아·루마니아 등 한국에 거의 소개되지 않은 작품을 직접 발굴하고 번역해 출간합니다.",
  },
  {
    num: "03",
    title: "AI 기반 자체 도구",
    body:
      "Claude API 기반 한국어 교정 엔진 OrangeRefine과 인플루언서 데이터 분석 N인플을 자체 개발·운영합니다.",
  },
];

export default function Why() {
  return (
    <section id="why" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.2em] text-primary-dark uppercase">
            Why Orange Library
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            왜 <span className="italic">오렌지도서관</span>인가
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            읽기 · 쓰기 · 출판 · 분석을 한 사람이 책임지고 운영합니다.
          </p>
        </div>

        <ul className="mt-16 grid gap-px bg-border/60 overflow-hidden rounded-3xl border border-border/60 md:grid-cols-3">
          {points.map((p) => (
            <li
              key={p.num}
              className="flex flex-col bg-background p-8 md:p-10 transition hover:bg-primary-soft/40"
            >
              <span className="font-display text-5xl font-semibold text-primary-light">
                {p.num}
              </span>
              <h3 className="mt-6 text-xl font-bold tracking-tight">
                {p.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-muted">
                {p.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
