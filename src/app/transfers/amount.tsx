import { useRouter } from "expo-router";
import { useState } from "react";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useTransferDraftStore } from "@/features/transfers/transferDraftStore";
import { parseMajorUnitsToMinor } from "@/utils/money";

const AMOUNT_PATTERN = /^[1-9][0-9]*$/;

/**
 * Figma "Send Money — Amount & Remark Screen". Fee/stamp-duty amounts are
 * never computed client-side (parc-interview-answers.md §8) — whatever
 * `quoteTransfer` returns is authoritative, and its shape is itself an
 * undocumented-response gap (PLAN.md Part 4/7), so the fee display is
 * best-effort.
 */
export default function TransferAmountScreen() {
  const router = useRouter();
  const { accountName, currency, setAmount } = useTransferDraftStore();
  const [amountNaira, setAmountNaira] = useState("");
  const [narration, setNarration] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountMinor = parseMajorUnitsToMinor(amountNaira) ?? "";
  const isValidAmount = AMOUNT_PATTERN.test(amountMinor);

  async function handleContinue() {
    const draft = useTransferDraftStore.getState();
    if (!draft.enquiryToken) {
      setError("Missing verified recipient. Please go back and re-enter the account details.");
      return;
    }
    setIsQuoting(true);
    setError(null);
    try {
      const { quoteId, feeMinor } = await api.quoteTransfer({ enquiryToken: draft.enquiryToken, amountMinor, currency, narration: narration.trim() || undefined });
      setAmount(amountMinor, narration.trim(), quoteId, feeMinor);
      router.push("/transfers/review");
    } catch (quoteError) {
      setError(quoteError instanceof ApiError ? quoteError.message : "Something went wrong. Please try again.");
    } finally {
      setIsQuoting(false);
    }
  }

  return (
    <FormScreenLayout
      title={accountName ? `Send to ${accountName}` : "Enter amount"}
      errorMessage={error}
      footer={<Button label="Review Transfer" onPress={handleContinue} disabled={!isValidAmount} loading={isQuoting} />}
    >
      <TextField value={amountNaira} onChangeText={setAmountNaira} placeholder="Amount (₦)" keyboardType="decimal-pad" autoFocus />
      <TextField value={narration} onChangeText={setNarration} placeholder="What's this for? (optional)" maxLength={140} />
    </FormScreenLayout>
  );
}
