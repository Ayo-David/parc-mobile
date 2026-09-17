import { randomUUID } from "expo-crypto";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useSavingsRecordsStore } from "@/state/stores/savingsRecordsStore";
import { useTheme } from "@/theme";
import { formatMoney, parseMajorUnitsToMinor } from "@/utils/money";

/**
 * CONFIRMED BLOCKED (PLAN.md "Real blockers"): opening a fixed deposit
 * requires a `product_version_id`, but no endpoint anywhere in the savings
 * contract lists published savings products/versions — `POST
 * /v1/savings-products*` only *creates* products (back-office use), and
 * there is no corresponding `GET`. Unlike Loans (which gets its catalog
 * from the bespoke `GET /v1/loans/summary` composition endpoint), Savings
 * has no analogous composition endpoint either. There is no honest way
 * for a real customer to discover a valid product version in this build.
 * In development builds only, a manually-provided product-version id
 * (from a seeded backend, known out of band) lets the rest of the
 * quote -> create flow be exercised and verified.
 */
export default function CreateFixedDepositScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const addFixedDeposit = useSavingsRecordsStore((state) => state.addFixedDeposit);
  const [productVersionId, setProductVersionId] = useState(__DEV__ ? (process.env.EXPO_PUBLIC_DEV_FIXED_DEPOSIT_PRODUCT_VERSION_ID ?? "") : "");
  const [principalNaira, setPrincipalNaira] = useState("");
  const [tenorDays, setTenorDays] = useState("");
  const [quote, setQuote] = useState<Awaited<ReturnType<typeof api.quoteFixedDeposit>> | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const principalMinor = parseMajorUnitsToMinor(principalNaira);
  const tenorDaysNumber = Number(tenorDays);
  const canQuote = !!productVersionId && !!principalMinor && Number.isInteger(tenorDaysNumber) && tenorDaysNumber > 0;

  async function handleQuote() {
    if (!canQuote || !principalMinor) return;
    setIsQuoting(true);
    setError(null);
    try {
      const result = await api.quoteFixedDeposit({ productVersionId, principalMinor, tenorDays: tenorDaysNumber, correlationId: randomUUID() });
      setQuote(result);
    } catch (quoteError) {
      setError(quoteError instanceof ApiError ? quoteError.message : "Something went wrong getting a quote.");
    } finally {
      setIsQuoting(false);
    }
  }

  async function handleConfirm() {
    if (!quote || !principalMinor) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await api.createFixedDeposit({
        productVersionId,
        amountMinor: principalMinor,
        tenureDays: tenorDaysNumber,
        quoteId: quote.quote_id,
        quoteHash: quote.quote_hash,
        acceptedAt: new Date().toISOString(),
        acceptanceReference: randomUUID(),
        correlationId: randomUUID(),
        idempotencyKey: createIdempotencyKey(),
      });
      addFixedDeposit({ id: result.fixed_deposit_id });
      router.replace("/(tabs)/savings");
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't confirm this went through. Please check your savings tab before trying again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!__DEV__) {
    return (
      <FormScreenLayout title="Open a fixed deposit">
        <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary }}>Fixed deposits aren't available yet in this build.</Text>
      </FormScreenLayout>
    );
  }

  return (
    <FormScreenLayout
      title="Open a fixed deposit"
      errorMessage={error}
      footer={quote ? <Button label="Confirm Fixed Deposit" onPress={handleConfirm} loading={isSubmitting} /> : <Button label="Get Quote" onPress={handleQuote} disabled={!canQuote} loading={isQuoting} />}
    >
      <Text style={{ ...theme.typography.caption, color: theme.colors.warning }}>[DEV ONLY] Manually-provided product version id — see comment in this file.</Text>
      <TextField value={productVersionId} onChangeText={setProductVersionId} placeholder="Product version id (dev only)" editable={!quote} />
      <TextField value={principalNaira} onChangeText={setPrincipalNaira} placeholder="Principal amount (₦)" keyboardType="decimal-pad" editable={!quote} />
      <TextField value={tenorDays} onChangeText={setTenorDays} placeholder="Tenor (days)" keyboardType="number-pad" editable={!quote} />
      {quote ? (
        <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textPrimary }}>
          Expected interest: {formatMoney({ amount_minor: quote.expected_interest_minor, currency: quote.currency })}. Payout: {formatMoney({ amount_minor: quote.payout_minor, currency: quote.currency })}.
        </Text>
      ) : null}
    </FormScreenLayout>
  );
}
