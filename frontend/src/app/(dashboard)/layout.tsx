import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { AuthGate } from "@/components/auth/AuthGate"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="app-shell flex min-h-screen text-[var(--foreground)]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="w-full flex-1 px-5 py-8 md:px-10 lg:px-14 lg:py-12">
            {children}
          </main>
        </div>
      </div>
    </AuthGate>
  )
}
