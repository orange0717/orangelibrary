export default function Hero() {
  return (
    <section
      className="px-6 py-20 text-center md:py-32"
      style={{
        background: "linear-gradient(135deg, #F2F2F2 0%, #FDE8D4 100%)",
      }}
    >
      <div className="mx-auto max-w-3xl">
        <span className="inline-block rounded-full bg-primary px-4 py-1 text-[11px] font-bold uppercase tracking-[1px] text-white">
          Orange Library
        </span>

        <h1 className="mt-5 font-serif text-[32px] font-extrabold leading-[1.35] tracking-tight text-foreground md:text-[48px]">
          책과 글, 그리고 세계 문학.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.7] text-muted md:text-base">
          네이버 도서리뷰 인플루언서가 직접 운영하는 통합 플랫폼입니다.
          제3세계 문학 출판부터 AI 글쓰기 도구, 인플루언서 데이터 분석까지
          한 사람이 책임지고 운영합니다.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#services"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-[15px] font-bold text-white shadow-sm transition hover:bg-primary-dark"
          >
            서비스 둘러보기
            <span aria-hidden>→</span>
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-8 py-3.5 text-[15px] font-bold text-foreground transition hover:bg-primary-light"
          >
            상담 문의
          </a>
        </div>
      </div>
    </section>
  );
}
