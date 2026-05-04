import Link from "next/link";

const services = [
  { href: "https://in.naver.com/orangelibrary", label: "네이버 도서리뷰 인플루언서" },
  { href: "https://www.yes24.com/product/search?domain=ALL&query=%EC%98%A4%EB%A0%8C%EC%A7%80%EB%8F%84%EC%84%9C%EA%B4%80", label: "제3세계 문학출판사" },
  { href: "https://orangerefine.kr", label: "OrangeRefine" },
  { href: "https://naver-influencer.vercel.app", label: "N인플" },
  { href: "https://orangemarketing.co.kr", label: "파워콘텐츠 광고전문" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-primary-soft/50">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2" aria-label="오렌지도서관">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white font-bold text-lg">
                O
              </span>
              <span className="text-lg font-bold tracking-tight">오렌지도서관</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              책과 글, 그리고 세계 문학.<br />
              읽기 · 쓰기 · 출판 · 분석을 한 곳에서.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-tight">서비스</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {services.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener"
                    className="transition hover:text-primary-dark"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-tight">사업자 정보</h3>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
              <li>상호: 주식회사 오렌지마케팅</li>
              <li>대표: 한미선</li>
              <li>사업자등록번호: 618-81-36889</li>
              <li>통신판매번호: 2025-충남천안-0444</li>
              <li className="pt-1">
                <a href="tel:0507-1379-4238" className="hover:text-primary-dark">
                  0507-1379-4238
                </a>
              </li>
              <li>
                <a href="mailto:orange@orangelibrary.co.kr" className="hover:text-primary-dark">
                  orange@orangelibrary.co.kr
                </a>
              </li>
              <li className="text-xs text-muted-soft">
                충남 천안시 서북구 검은들 3길 46<br />803-2(805호)
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/60 pt-6 text-xs text-muted-soft">
          © {new Date().getFullYear()} 주식회사 오렌지마케팅. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
