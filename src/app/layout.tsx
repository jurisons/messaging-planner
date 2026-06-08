import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Messaging Launch Planner — Messente',
  description: 'Get a step-by-step messaging launch plan for any country. SMS, WhatsApp, and RCS registration timelines, compliance checklists, and gotchas.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>{children}</body>
    </html>
  )
}
