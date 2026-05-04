const items = [
  {
    label: "전화",
    value: "0507-1379-4238",
    href: "tel:0507-1379-4238",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.92.37 1.83.7 2.7a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.38-1.38a2 2 0 0 1 2.11-.45c.87.33 1.78.57 2.7.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    label: "이메일",
    value: "orange@orangelibrary.co.kr",
    href: "mailto:orange@orangelibrary.co.kr",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    label: "주소",
    value: "충남 천안시 서북구 검은들 3길 46 803-2(805호)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

export default function Contact() {
  return (
    <section id="contact" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <p className="text-sm font-semibold tracking-[0.2em] text-primary-dark uppercase">
              Contact
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              문의하기
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              언제든지 편하게 연락주세요.<br />
              어떤 서비스가 필요하신지<br />
              전문가가 친절하게 안내해드립니다.
            </p>

            <a
              href="http://pf.kakao.com/_xfnxden"
              target="_blank"
              rel="noopener"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#FEE500] px-7 py-3.5 text-sm font-semibold text-[#3C1E1E] transition hover:brightness-95"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <path d="M9 1C4.58 1 1 3.86 1 7.39c0 2.27 1.49 4.27 3.74 5.4l-.95 3.49c-.08.31.26.55.52.37l4.16-2.74c.18.01.35.02.53.02 4.42 0 8-2.86 8-6.54S13.42 1 9 1z" />
              </svg>
              카카오톡 상담 시작
            </a>
          </div>

          <ul className="md:col-span-7 grid content-start gap-4">
            {items.map((it) => {
              const inner = (
                <div className="flex items-start gap-5 rounded-2xl border border-border/60 bg-card p-6 transition hover:border-primary/40 hover:shadow-md">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-dark">
                    {it.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-soft">
                      {it.label}
                    </p>
                    <p className="mt-1.5 text-base font-medium text-foreground">
                      {it.value}
                    </p>
                  </div>
                </div>
              );
              return (
                <li key={it.label}>
                  {it.href ? (
                    <a href={it.href} className="block">
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
