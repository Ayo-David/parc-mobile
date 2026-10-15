import { create } from "zustand";

import type { CustomerLoanQuote, RepaymentFrequency } from "@/api/schemas";

interface LoanApplicationDraftState {
  productVersionId: string | null;
  amountMinor: string | null;
  tenor: number | null;
  repaymentFrequency: RepaymentFrequency;
  purpose: string;
  employerName: string;
  monthlySalaryMinor: string | null;
  assetType: string;
  assetValueMinor: string | null;
  quote: CustomerLoanQuote | null;
  setProductVersionId: (id: string) => void;
  setTerms: (fields: Partial<Omit<LoanApplicationDraftState, "productVersionId" | "quote">>) => void;
  setQuote: (quote: CustomerLoanQuote) => void;
  reset: () => void;
}

const initialDraft = {
  productVersionId: null,
  amountMinor: null,
  tenor: null,
  repaymentFrequency: "monthly" as RepaymentFrequency,
  purpose: "",
  employerName: "",
  monthlySalaryMinor: null,
  assetType: "",
  assetValueMinor: null,
  quote: null,
} satisfies Partial<LoanApplicationDraftState>;

/** Transient in-memory state for the loan-application wizard — same rationale as transferDraftStore/billDraftStore. */
export const useLoanApplicationDraftStore = create<LoanApplicationDraftState>((set) => ({
  ...initialDraft,
  setProductVersionId: (productVersionId) => set({ productVersionId }),
  setTerms: (fields) => set(fields),
  setQuote: (quote) => set({ quote }),
  reset: () => set(initialDraft),
}));
