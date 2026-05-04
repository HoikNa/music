export const queryKeys = {
  personas: {
    all: ["personas"] as const,
    detail: (id: string) => ["personas", id] as const,
  },
  submissions: {
    mine: (cursor?: string) => ["submissions", "mine", cursor] as const,
    detail: (id: string) => ["submissions", id] as const,
  },
  rankings: {
    weekly: (personaId?: string, genre?: string) =>
      ["rankings", "weekly", { personaId, genre }] as const,
    monthly: () => ["rankings", "monthly"] as const,
    aroundMe: () => ["rankings", "aroundMe"] as const,
  },
  credits: {
    balance: () => ["credits", "balance"] as const,
    transactions: (cursor?: string) =>
      ["credits", "transactions", cursor] as const,
  },
  me: () => ["me"] as const,
}
