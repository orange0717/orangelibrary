import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 256, height: 256 };
export const contentType = 'image/png';

export default function Icon() {
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
          fontSize: 200,
          fontWeight: 900,
          fontFamily: 'serif',
          letterSpacing: -8,
        }}
      >
        橙
      </div>
    ),
    { ...size },
  );
}
