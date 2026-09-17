import { create } from "zustand";

interface TransferDraftState {
  bankCode: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  enquiryToken: string | null;
  amountMinor: string | null;
  currency: string;
  narration: string;
  quoteId: string | null;
  feeMinor: string | null;
  setBank: (bankCode: string, bankName: string) => void;
  setAccount: (accountNumber: string, accountName: string, enquiryToken: string | null) => void;
  setAmount: (amountMinor: string, narration: string, quoteId: string | null, feeMinor: string | null) => void;
  reset: () => void;
}

const initialDraft = {
  bankCode: null,
  bankName: null,
  accountNumber: null,
  accountName: null,
  enquiryToken: null,
  amountMinor: null,
  currency: "NGN",
  narration: "",
  quoteId: null,
  feeMinor: null,
} satisfies Partial<TransferDraftState>;

/**
 * Transient in-memory state for the multi-screen Send Money wizard (Account
 * Entry -> Bank Picker -> Amount & Remark -> Review -> Success). Not
 * persisted — a killed app restarts the flow from scratch, which is
 * correct for an uncommitted money-movement draft.
 */
export const useTransferDraftStore = create<TransferDraftState>((set) => ({
  ...initialDraft,
  setBank: (bankCode, bankName) => set({ bankCode, bankName }),
  setAccount: (accountNumber, accountName, enquiryToken) => set({ accountNumber, accountName, enquiryToken }),
  setAmount: (amountMinor, narration, quoteId, feeMinor) => set({ amountMinor, narration, quoteId, feeMinor }),
  reset: () => set(initialDraft),
}));
