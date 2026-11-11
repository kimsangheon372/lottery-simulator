import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '복권 시뮬레이터 | 오늘의 행운 번호',
  description: '로또 6/45와 연금복권 720+ 추천 번호를 조건에 맞게 생성하고 저장해 보세요. 당첨을 예측하거나 보장하지 않는 재미용 번호 생성 서비스입니다.',
  keywords: ['복권 시뮬레이터', '로또 번호 추천', '연금복권 720+', '번호 생성'],
  openGraph: {
    title: '복권 시뮬레이터',
    description: '다음 추첨 회차를 위한 나만의 번호 조합',
    locale: 'ko_KR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#09111e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>
}
