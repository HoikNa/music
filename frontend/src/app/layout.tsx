import type { Metadata } from "next"
import { Playfair_Display } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/common/Providers"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Vertual Owl — AI 음악 경연 플랫폼",
  description: "페르소나 AI가 심사하는 상시형 음원 경연 플랫폼",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`h-full ${playfair.variable}`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
