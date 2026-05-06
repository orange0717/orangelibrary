import type { Metadata } from "next";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Why from "@/components/Why";
import Contact from "@/components/Contact";

export const metadata: Metadata = {
  description:
    "오렌지도서관은 네이버 도서리뷰 인플루언서이자 제3세계 문학(카자흐스탄·말레이시아·루마니아) 전문 출판사입니다. AI 한국어 교정 OrangeRefine, 인플루언서 분석 N인플을 함께 운영하는 통합 플랫폼.",
  alternates: { canonical: "https://orangelibrary.co.kr" },
  openGraph: {
    title: "오렌지도서관 | 책과 글, 그리고 세계 문학",
    description:
      "도서리뷰 인플루언서·제3세계 문학 출판·AI 한국어 교정·인플루언서 분석 통합 플랫폼",
    url: "https://orangelibrary.co.kr",
    siteName: "오렌지도서관",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "오렌지도서관 | 책과 글, 그리고 세계 문학",
    description: "도서리뷰·출판·AI 글쓰기·인플루언서 분석 통합 플랫폼",
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Why />
      <Contact />
    </>
  );
}
