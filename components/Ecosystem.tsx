const stages = [
  { step: "STEP 01", label: "읽기 · 리뷰", service: "네이버 도서리뷰 인플루언서" },
  { step: "STEP 02", label: "쓰기 · 다듬기", service: "OrangeRefine" },
  { step: "STEP 03", label: "번역 · 출판", service: "제3세계 문학출판사" },
  { step: "STEP 04", label: "분석 · 확산", service: "N인플" },
];

export default function Ecosystem() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 bg-foreground text-background">
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(40% 40% at 100% 0%, #F29C68 0%, transparent 60%), radial-gradient(50% 60% at 0% 100%, #D87A45 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.2em] text-primary-light uppercase">
            Ecosystem
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            책이 독자에게 닿기까지
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-background/70">
            읽기 → 쓰기 → 출판 → 알리기, 오렌지도서관이 모든 단계에 함께합니다.
          </p>
        </div>

        <ol className="mt-16 grid gap-5 md:grid-cols-4">
          {stages.map((s, i) => (
            <li
              key={s.step}
              className="group relative rounded-2xl border border-background/15 bg-background/[0.04] p-6 backdrop-blur-sm transition hover:border-primary/40 hover:bg-background/[0.08]"
            >
              <p className="font-display text-xs font-semibold tracking-[0.25em] text-primary-light">
                {s.step}
              </p>
              <p className="mt-5 text-2xl font-bold tracking-tight">{s.label}</p>
              <p className="mt-3 text-sm text-background/60">{s.service}</p>

              {i < stages.length - 1 && (
                <span
                  aria-hidden
                  className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 text-primary-light md:block"
                >
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
