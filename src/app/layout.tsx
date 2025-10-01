import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import SmoothScroll from '@/components/providers/SmoothScroll'
import Navbar from '@/components/Navbar'

const cairo = Cairo({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cosentus',
  description: 'Premium web experience',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cairo.className}>
        <Navbar />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  )
}