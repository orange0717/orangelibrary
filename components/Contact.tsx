export default function Contact() {
  return (
    <section id="contact" className="bg-surface px-6 py-24 md:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-[1.5px] text-primary">
            Contact
          </p>
          <h2 className="mt-3 font-serif text-[28px] font-extrabold tracking-tight md:text-[36px]">
            문의하기
          </h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-muted">
            출판 제안, 번역 협업, 광고·콘텐츠 제작 문의 모두 환영합니다.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <a
            href="tel:0507-1379-4238"
            className="group flex flex-col items-center rounded-[14px] border border-border-strong/60 bg-surface p-7 text-center transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_6px_24px_rgba(191,140,128,0.12)]"
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-primary">
              Phone
            </p>
            <p className="mt-2 font-serif text-[18px] font-bold tracking-tight">전화 문의</p>
            <p className="mt-3 text-[15px] font-medium text-muted">0507-1379-4238</p>
          </a>

          <a
            href="mailto:orange@orangelibrary.co.kr"
            className="group flex flex-col items-center rounded-[14px] border border-border-strong/60 bg-surface p-7 text-center transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_6px_24px_rgba(191,140,128,0.12)]"
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-primary">
              Email
            </p>
            <p className="mt-2 font-serif text-[18px] font-bold tracking-tight">이메일 문의</p>
            <p className="mt-3 text-[14px] font-medium text-muted break-all">
              orange@orangelibrary.co.kr
            </p>
          </a>

          <a
            href="http://pf.kakao.com/_xfnxden"
            target="_blank"
            rel="noopener"
            className="group flex flex-col items-center rounded-[14px] border border-border-strong/60 bg-surface p-7 text-center transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_6px_24px_rgba(191,140,128,0.12)]"
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-primary">
              KakaoTalk
            </p>
            <p className="mt-2 font-serif text-[18px] font-bold tracking-tight">카카오톡 상담</p>
            <p className="mt-3 text-[15px] font-medium text-muted">실시간 응답</p>
          </a>
        </div>

        <p className="mt-10 text-center text-[13px] text-muted-soft">
          충남 천안시 서북구 검은들 3길 46 803-2(805호)
        </p>
      </div>
    </section>
  );
}
