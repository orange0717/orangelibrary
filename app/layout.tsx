import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const SITE_URL = "https://orangelibrary.co.kr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "오렌지도서관 | 책과 글, 그리고 세계 문학",
    template: "%s | 오렌지도서관",
  },
  description:
    "오렌지도서관 — 네이버 도서리뷰 인플루언서가 운영하는 출판·AI 글쓰기 OrangeRefine·인플루언서 분석 N인플 통합 플랫폼.",
  keywords: [
    "오렌지도서관",
    "도서리뷰 인플루언서",
    "제3세계 문학",
    "카자흐스탄 문학",
    "말레이시아 문학",
    "루마니아 문학",
    "OrangeRefine",
    "AI 한국어 교정",
    "맞춤법 검사기",
    "N인플",
    "네이버 인플루언서",
    "파워콘텐츠 광고",
    "출판사",
  ],
  authors: [{ name: "주식회사 오렌지도서관" }],
  creator: "주식회사 오렌지도서관",
  publisher: "주식회사 오렌지도서관",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "오렌지도서관",
    title: "오렌지도서관 | 책과 글, 그리고 세계 문학",
    description:
      "오렌지도서관 — 네이버 도서리뷰 인플루언서가 운영하는 출판·AI 글쓰기 OrangeRefine·인플루언서 분석 N인플 통합 플랫폼.",
  },
  twitter: {
    card: "summary_large_image",
    title: "오렌지도서관 | 책과 글, 그리고 세계 문학",
    description: "도서리뷰·출판·AI 글쓰기·인플루언서 분석 통합 플랫폼",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    other: {
      "naver-site-verification": "naver4d2d32e35886b0a3068899fbf8c8621d",
    },
  },
  category: "publishing",
};

export const viewport: Viewport = {
  themeColor: "#C9603A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "주식회사 오렌지도서관",
    alternateName: "오렌지도서관",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon`,
      width: 256,
      height: 256,
    },
    image: `${SITE_URL}/opengraph-image`,
    description:
      "도서리뷰 인플루언서, 제3세계 문학 출판, AI 한국어 교정, 인플루언서 분석을 운영하는 통합 플랫폼",
    foundingDate: "2022",
    founder: { "@type": "Person", name: "한미선" },
    address: {
      "@type": "PostalAddress",
      addressCountry: "KR",
      addressRegion: "충청남도",
      addressLocality: "천안시 서북구",
      streetAddress: "검은들 3길 46 803-2(805호)",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+82-507-1379-4238",
      contactType: "customer service",
      email: "orange@orangelibrary.co.kr",
      availableLanguage: ["Korean"],
    },
    sameAs: [
      "https://in.naver.com/orangelibrary",
      "https://orangerefine.kr",
      "https://naver-influencer.vercel.app",
      "https://orangemarketing.co.kr",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "오렌지도서관",
    alternateName: ["OrangeLibrary", "오렌지 도서관"],
    description:
      "도서리뷰 인플루언서, 제3세계 문학 출판, AI 한국어 교정, 인플루언서 분석을 운영하는 통합 플랫폼",
    inLanguage: "ko-KR",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${notoSerifKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
