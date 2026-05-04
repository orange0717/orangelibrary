import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 0%, #FBC9A6 0%, rgba(251,201,166,0) 60%), radial-gradient(50% 60% at 0% 30%, #FFE4D0 0%, rgba(255,228,208,0) 70%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-5 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="grid items-center gap-14 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-soft px-4 py-1.5 text-xs font-semibold tracking-wide text-primary-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              Books · Writing · World Literature
            </div>

            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              책과 글,<br />
              <span className="italic text-primary-dark">그리고 세계 문학</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
              네이버 도서리뷰 인플루언서 활동, 카자흐스탄·말레이시아·루마니아 문학 출판,<br className="hidden md:inline" />
              AI 글쓰기 도구 <span className="font-semibold text-foreground">OrangeRefine</span>, 인플루언서 분석 <span className="font-semibold text-foreground">N인플</span>까지 — 오렌지도서관이 함께합니다.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background transition hover:bg-primary-dark"
              >
                서비스 둘러보기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/15 bg-card px-7 py-3.5 text-sm font-semibold text-foreground transition hover:border-foreground/30"
              >
                무료 상담
              </a>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border/60 pt-8 max-w-md">
              <div>
                <dt className="text-xs font-medium text-muted-soft">사업 영역</dt>
                <dd className="mt-1 font-display text-2xl font-semibold">5</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-soft">출판 국가</dt>
                <dd className="mt-1 font-display text-2xl font-semibold">3</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-soft">자체 AI</dt>
                <dd className="mt-1 font-display text-2xl font-semibold">2</dd>
              </div>
            </dl>
          </div>

          <div className="md:col-span-5">
            <div className="relative mx-auto max-w-sm md:max-w-none">
              <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-[#A6582B] p-10 shadow-2xl shadow-primary/20">
                <div className="flex h-full flex-col justify-between text-white">
                  <div>
                    <p className="font-display text-xs uppercase tracking-[0.3em] opacity-80">Est. 2022</p>
                    <p className="mt-3 font-display text-3xl font-medium leading-snug">
                      읽고, 쓰고,<br />출판하고, 알리다.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90 leading-relaxed">
                      &ldquo;한 사람의 깊은 독서가<br />한 권의 책을 살린다.&rdquo;
                    </p>
                    <p className="mt-3 text-xs opacity-70">— 오렌지도서관</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 hidden md:block h-24 w-24 rounded-2xl bg-card border border-border/60 shadow-lg" />
              <div className="absolute -top-4 -right-4 hidden md:block h-16 w-16 rounded-xl bg-primary-light border border-primary/20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
