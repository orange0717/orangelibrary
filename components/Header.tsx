"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "#services", label: "서비스" },
  { href: "#why", label: "소개" },
  { href: "#contact", label: "문의" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 group" aria-label="오렌지도서관 홈">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white font-bold text-lg transition group-hover:bg-primary-dark">
            O
          </span>
          <span className="text-lg font-bold tracking-tight">
            오렌지도서관
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted transition hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <a
            href="http://pf.kakao.com/_xfnxden"
            target="_blank"
            rel="noopener"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark hover:shadow"
          >
            카카오톡 상담
          </a>
        </nav>

        <button
          type="button"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-primary-soft"
          aria-label="메뉴 열기"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-border/60 bg-background" aria-label="모바일 메뉴">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-muted hover:bg-primary-soft hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <a
              href="http://pf.kakao.com/_xfnxden"
              target="_blank"
              rel="noopener"
              className="mt-2 rounded-lg bg-primary px-3 py-3 text-center text-sm font-semibold text-white"
            >
              카카오톡 상담
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
