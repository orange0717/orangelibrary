import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#C9603A',
          color: 'white',
          fontSize: 140,
          fontWeight: 900,
          fontFamily: 'serif',
          letterSpacing: -6,
        }}
      >
        橙
      </div>
    ),
    { ...size },
  );
}
