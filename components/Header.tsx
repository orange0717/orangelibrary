"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "#services", label: "서비스" },
  { href: "#about", label: "소개" },
  { href: "#contact", label: "문의" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-serif text-[19px] font-bold tracking-tight text-foreground"
          aria-label="오렌지도서관 홈"
        >
          오렌지도서관
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[14px] font-medium text-muted transition hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <a
            href="http://pf.kakao.com/_xfnxden"
            target="_blank"
            rel="noopener"
            className="rounded-full bg-primary px-5 py-2 text-[13px] font-bold text-white transition hover:bg-primary-dark"
          >
            상담 문의
          </a>
        </nav>

        <button
          type="button"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center text-muted"
          aria-label="메뉴 열기"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-border bg-surface" aria-label="모바일 메뉴">
          <div className="mx-auto flex max-w-6xl flex-col px-6 py-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-[14px] font-medium text-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <a
              href="http://pf.kakao.com/_xfnxden"
              target="_blank"
              rel="noopener"
              className="mt-3 rounded-full bg-primary py-3 text-center text-[13px] font-bold text-white"
            >
              상담 문의
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
