const points = [
  {
    title: "현직 도서리뷰 인플루언서",
    body:
      "네이버 공식 도서리뷰 인플루언서로서 매일 책을 읽고 쓰는 사람이 직접 출판·서비스를 기획·운영합니다.",
  },
  {
    title: "제3세계 문학 직접 발굴",
    body:
      "카자흐스탄·말레이시아·루마니아 등 한국에 거의 소개되지 않은 작품을 직접 발굴하고 번역해 출간합니다.",
  },
  {
    title: "AI 기반 자체 도구",
    body:
      "Claude API 기반 한국어 교정 엔진 OrangeRefine과 인플루언서 데이터 분석 N인플을 자체 개발·운영합니다.",
  },
];

export default function Why() {
  return (
    <section id="about" className="px-6 py-24 md:py-28" style={{ background: "#FFF8F2" }}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-[1.5px] text-primary">
            Why Orange Library
          </p>
          <h2 className="mt-3 font-serif text-[28px] font-extrabold tracking-tight md:text-[36px]">
            왜 오렌지도서관인가
          </h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-muted">
            읽기 · 쓰기 · 출판 · 분석을 한 사람이 책임지고 운영합니다.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {points.map((p, i) => (
            <div
              key={p.title}
              className="rounded-[14px] border border-border-strong/60 bg-surface p-7"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-[15px] font-extrabold text-white">
                {i + 1}
              </span>
              <h3 className="mt-5 font-serif text-[18px] font-bold tracking-tight">
                {p.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.75] text-muted">{p.body}</p>
            </div>
          ))}
        </div>

        <blockquote
          className="mx-auto mt-14 max-w-3xl rounded-[16px] border-l-4 border-primary bg-surface p-8 shadow-sm"
        >
          <p className="text-[15.5px] leading-[1.85] text-foreground md:text-base">
            <span className="mr-1 text-2xl font-serif text-primary">“</span>
            출판의 시작은 깊은 독서입니다. 매일 책을 읽고 리뷰를 써온 시간이
            결국 한국에 소개되지 않은 좋은 작품을 발굴하는 눈을 키웠습니다.
          </p>
          <footer className="mt-4 text-[13px] font-medium text-muted-soft">
            — 오렌지도서관 대표 한미선
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
