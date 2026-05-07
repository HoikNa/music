import { Header } from "@/components/layout/Header"
import { AuthGate } from "@/components/auth/AuthGate"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-white text-[var(--foreground)]">
        <Header />
        <main className="mx-auto max-w-[1200px] px-4 py-6">
          {children}
        </main>
      </div>
    </AuthGate>
  )
}
