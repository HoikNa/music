"use client"

import { useQuery } from "@tanstack/react-query"
import { CreditCard, ReceiptText, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { queryKeys } from "@/lib/queryKeys"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { CreditTransaction, PagedResponse } from "@/types/api"

const CREDIT_REASON_LABELS: Record<string, string> = {
  signup_bonus: "가입 보너스",
  bonus: "보너스",
  purchase: "충전",
  submission: "음원 제출",
  reward: "보상",
  refund: "환불",
  admin: "관리자 조정",
}

const PACKAGES = [
  { credits: 5, price: "₩4,900", popular: false },
  { credits: 15, price: "₩9,900", popular: true },
  { credits: 30, price: "₩16,900", popular: false },
]

export default function CreditsPage() {
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: queryKeys.credits.balance(),
    queryFn: () => api.get<{ balance: number }>("/credits/balance"),
  })

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: queryKeys.credits.transactions(),
    queryFn: () => api.get<PagedResponse<CreditTransaction>>("/credits/transactions"),
  })

  function handlePurchase(credits: number) {
    toast.info(`${credits}크레딧 구매 기능은 준비 중입니다`)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="app-card-lift p-6">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[var(--brand-bg)] text-[var(--brand)]">
          <Wallet className="size-5" />
        </div>
        <h1 className="text-2xl font-black">크레딧</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">AI 심사와 음원 제출에 사용하는 잔액입니다.</p>
      </div>

      {/* Balance */}
      <div className="sunset-gradient rounded-lg p-6 text-white shadow-lg">
        <p className="text-sm text-[var(--text-muted)] mb-1">현재 잔액</p>
        {balanceLoading ? (
          <Skeleton className="h-10 w-24" />
        ) : (
          <p className="font-mono text-4xl font-black tabular-nums">
            {balanceData?.balance ?? 0}
            <span className="ml-1 text-lg font-normal text-white/80">크레딧</span>
          </p>
        )}
        <p className="mt-2 text-xs text-white/80">음원 1회 제출 시 1크레딧 차감</p>
      </div>

      {/* Purchase */}
      <div>
        <h2 className="font-bold mb-3">크레딧 충전</h2>
        <div className="grid gap-3">
          {PACKAGES.map(({ credits, price, popular }) => (
            <div key={credits}
              className="app-card flex items-center justify-between p-4 transition-colors"
              style={{ borderColor: popular ? "var(--brand)" : "var(--border)" }}>
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-[var(--brand)]" />
                  <p className="font-bold">{credits}크레딧</p>
                  {popular && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "var(--brand)", color: "white" }}>인기</span>
                  )}
                </div>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--accent)" }}>{price}</p>
              </div>
              <Button
                size="sm"
                onClick={() => handlePurchase(credits)}
                style={{ background: popular ? "var(--brand)" : undefined }}
                variant={popular ? "default" : "outline"}
              >
                구매
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="font-bold mb-3">이용 내역</h2>
        {txLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : (txData?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-8">이용 내역이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {txData?.items.map((tx, i) => (
              <div key={i} className="app-card flex items-center justify-between px-4 py-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <ReceiptText className="size-4 text-[var(--text-muted)]" />
                    {CREDIT_REASON_LABELS[tx.reason] ?? tx.reason}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(tx.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm" style={{ color: tx.delta > 0 ? "var(--success)" : "var(--error)" }}>
                    {tx.delta > 0 ? `+${tx.delta}` : tx.delta}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">잔액 {tx.balance_after}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
