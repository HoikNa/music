"use client"

import { create } from "zustand"
import type { RankingEntry } from "@/types/api"

interface RankingStore {
  entries: RankingEntry[]
  myEntry: RankingEntry | null
  lastUpdated: Date | null
  setEntries: (entries: RankingEntry[]) => void
  updateEntry: (entry: RankingEntry) => void
  setMyEntry: (entry: RankingEntry | null) => void
}

export const useRankingStore = create<RankingStore>((set) => ({
  entries: [],
  myEntry: null,
  lastUpdated: null,
  setEntries: (entries) => set({ entries, lastUpdated: new Date() }),
  updateEntry: (updated) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.submission_id === updated.submission_id ? updated : e
      ),
      lastUpdated: new Date(),
    })),
  setMyEntry: (myEntry) => set({ myEntry }),
}))
