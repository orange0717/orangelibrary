import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '오렌지도서관 — 책과 글, 그리고 세계 문학';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FFF7F0 0%, #FFE8D6 100%)',
          padding: 80,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 80,
            fontSize: 26,
            color: '#8C5A3C',
            letterSpacing: 2,
            fontWeight: 600,
          }}
        >
          ORANGELIBRARY.CO.KR
        </div>
        <div
          style={{
            fontSize: 130,
            fontWeight: 900,
            color: '#C9603A',
            lineHeight: 1,
            letterSpacing: -3,
            display: 'flex',
          }}
        >
          오렌지도서관
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 40,
            fontWeight: 700,
            color: '#3D2618',
            display: 'flex',
          }}
        >
          책과 글, 그리고 세계 문학
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 26,
            color: '#8C5A3C',
            display: 'flex',
          }}
        >
          제3세계 문학 출판 · 도서리뷰 · AI 글쓰기 통합 플랫폼
        </div>
        <div
          style={{
            marginTop: 40,
            display: 'flex',
            gap: 16,
          }}
        >
          {['오렌지도서관', 'OrangeRefine', 'N인플'].map((label) => (
            <div
              key={label}
              style={{
                padding: '10px 24px',
                background: '#FFFFFF',
                color: '#C9603A',
                fontSize: 22,
                fontWeight: 600,
                borderRadius: 999,
                border: '2px solid #E8A882',
                display: 'flex',
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            right: 80,
            fontSize: 22,
            color: '#8C5A3C',
            display: 'flex',
          }}
        >
          since 2022
        </div>
      </div>
    ),
    { ...size },
  );
}
