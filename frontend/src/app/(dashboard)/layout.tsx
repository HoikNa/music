import { Header } from "@/components/layout/Header"
import { AuthGate } from "@/components/auth/AuthGate"

const PUBLIC_DASHBOARD_PATHS = ["/rankings", "/explore"]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate publicPaths={PUBLIC_DASHBOARD_PATHS}>
      <div className="min-h-screen bg-[var(--paper)] text-[var(--foreground)]">
        <Header />
        <main className="mx-auto max-w-[1200px] px-4 py-6">
          {children}
        </main>
      </div>
    </AuthGate>
  )
}
