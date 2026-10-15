import { create } from "zustand";

import type { BillProduct } from "@/api/schemas";

interface BillDraftState {
  product: BillProduct | null;
  customerIdentifier: string | null;
  customerName: string | null;
  amountMinor: string | null;
  quoteId: string | null;
  totalDebitMinor: string | null;
  setProduct: (product: BillProduct) => void;
  setCustomer: (customerIdentifier: string, customerName: string | undefined) => void;
  setQuote: (amountMinor: string, quoteId: string, totalDebitMinor: string) => void;
  reset: () => void;
}

const initialDraft = { product: null, customerIdentifier: null, customerName: null, amountMinor: null, quoteId: null, totalDebitMinor: null } satisfies Partial<BillDraftState>;

/** Transient in-memory state for the bill-payment wizard — same rationale as transferDraftStore. */
export const useBillDraftStore = create<BillDraftState>((set) => ({
  ...initialDraft,
  setProduct: (product) => set({ product }),
  setCustomer: (customerIdentifier, customerName) => set({ customerIdentifier, customerName: customerName ?? null }),
  setQuote: (amountMinor, quoteId, totalDebitMinor) => set({ amountMinor, quoteId, totalDebitMinor }),
  reset: () => set(initialDraft),
}));
