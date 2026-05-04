const services = [
  { href: "https://in.naver.com/orangelibrary", label: "네이버 도서리뷰 인플루언서" },
  { href: "https://www.yes24.com/product/search?domain=ALL&query=%EC%98%A4%EB%A0%8C%EC%A7%80%EB%8F%84%EC%84%9C%EA%B4%80", label: "제3세계 문학 출판" },
  { href: "https://orangerefine.kr", label: "OrangeRefine" },
  { href: "https://naver-influencer.vercel.app", label: "N인플" },
  { href: "https://orangemarketing.co.kr", label: "파워콘텐츠 광고" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-soft">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-serif text-[18px] font-extrabold tracking-tight">오렌지도서관</p>
            <p className="mt-3 text-[13px] leading-[1.7] text-muted">
              읽고, 쓰고, 출판하고, 알리는 일을<br />
              한 사람이 책임지고 운영합니다.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="text-[12px] font-bold uppercase tracking-[1px] text-muted-soft">
              Services
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              {services.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener"
                    className="text-muted transition hover:text-primary"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="text-[12px] font-bold uppercase tracking-[1px] text-muted-soft">
              Company
            </p>
            <div className="mt-4 space-y-1.5 text-[13px] leading-[1.7] text-muted">
              <p>주식회사 오렌지마케팅 · 대표 한미선</p>
              <p>사업자등록번호 618-81-36889</p>
              <p>통신판매번호 2025-충남천안-0444</p>
              <p className="pt-2">
                <a href="tel:0507-1379-4238" className="hover:text-primary">0507-1379-4238</a>
                <span className="mx-2 text-muted-soft">·</span>
                <a href="mailto:orange@orangelibrary.co.kr" className="hover:text-primary">orange@orangelibrary.co.kr</a>
              </p>
              <p className="text-[12px] text-muted-soft">
                충남 천안시 서북구 검은들 3길 46 803-2(805호)
              </p>
            </div>
          </div>
        </div>

        <p className="mt-12 border-t border-border pt-6 text-[12px] text-muted-soft">
          © {new Date().getFullYear()} 주식회사 오렌지마케팅. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
