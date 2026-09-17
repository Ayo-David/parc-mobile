import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useProfile } from "@/api/queries/useProfile";
import type { BillCategory } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useBillDraftStore } from "@/features/bills/billDraftStore";
import { parseMajorUnitsToMinor } from "@/utils/money";

/** Only shown for VARIABLE denomination_type products (e.g. custom-amount airtime). */
export default function BillAmountScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: BillCategory }>();
  const profile = useProfile();
  const { product, customerIdentifier, setQuote } = useBillDraftStore();
  const [amountNaira, setAmountNaira] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountMinor = parseMajorUnitsToMinor(amountNaira) ?? "";
  const isValidAmount = /^[1-9][0-9]*$/.test(amountMinor);

  async function handleContinue() {
    if (!product || !customerIdentifier || !profile.data) return;
    setIsQuoting(true);
    setError(null);
    try {
      const quote = await api.quoteBillPayment({ customerId: profile.data.id, productId: product.id, customerIdentifier, amountMinor, idempotencyKey: createIdempotencyKey() });
      setQuote(amountMinor, quote.quote_id, quote.total_debit_minor);
      router.push({ pathname: "/bills/[category]/review", params: { category } });
    } catch (quoteError) {
      setError(quoteError instanceof ApiError ? quoteError.message : "Something went wrong. Please try again.");
    } finally {
      setIsQuoting(false);
    }
  }

  return (
    <FormScreenLayout title="Enter amount" errorMessage={error} footer={<Button label="Continue" onPress={handleContinue} disabled={!isValidAmount} loading={isQuoting} />}>
      <TextField value={amountNaira} onChangeText={setAmountNaira} placeholder="Amount (₦)" keyboardType="decimal-pad" autoFocus />
    </FormScreenLayout>
  );
}
