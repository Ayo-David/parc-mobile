import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import type { LoanType } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useLoanApplicationDraftStore } from "@/features/loans/loanApplicationDraftStore";
import { parseMajorUnitsToMinor } from "@/utils/money";

const LOAN_TYPE_TITLES: Record<LoanType, string> = {
  INSTANT: "Instant Loan",
  UNSECURED_PERSONAL: "Personal Loan",
  SALARY_BACKED: "Salary Loan",
  ASSET_FINANCE: "Asset Finance",
};

/**
 * Figma "Loan Product Screen" (Instant/Personal/Asset/Salary). One generic
 * screen parameterized by loanType, per SKILL.md. `tenor` (quote) and
 * `tenure_days` (application) are both treated as the same customer-entered
 * day count — the contract doesn't clarify whether `tenor`'s unit differs
 * per product, so this is a simplifying assumption, not a confirmed fact.
 */
export default function LoanProductScreen() {
  const { loanType, productVersionId } = useLocalSearchParams<{ loanType: LoanType; productVersionId: string }>();
  const router = useRouter();
  const draft = useLoanApplicationDraftStore();
  const [amountNaira, setAmountNaira] = useState("");
  const [tenorText, setTenorText] = useState("");
  const [purpose, setPurpose] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [monthlySalaryNaira, setMonthlySalaryNaira] = useState("");
  const [assetType, setAssetType] = useState("");
  const [assetValueNaira, setAssetValueNaira] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountMinor = parseMajorUnitsToMinor(amountNaira) ?? "";
  const tenor = /^[1-9][0-9]*$/.test(tenorText) ? Number(tenorText) : null;
  const monthlySalaryMinor = parseMajorUnitsToMinor(monthlySalaryNaira);
  const assetValueMinor = parseMajorUnitsToMinor(assetValueNaira);

  const isSalary = loanType === "SALARY_BACKED";
  const isAsset = loanType === "ASSET_FINANCE";

  const canContinue =
    /^[1-9][0-9]*$/.test(amountMinor) &&
    tenor !== null &&
    purpose.trim().length >= 2 &&
    (!isSalary || (employerName.trim() && monthlySalaryMinor)) &&
    (!isAsset || (assetType.trim() && assetValueMinor));

  async function handleContinue() {
    if (!canContinue || !tenor) return;
    setIsQuoting(true);
    setError(null);
    try {
      const quote = await api.quoteLoan({
        productVersionId,
        amountMinor,
        currency: "NGN",
        tenor,
        repaymentFrequency: "monthly",
        purpose: purpose.trim() || undefined,
        employerName: isSalary ? employerName.trim() : undefined,
        monthlySalaryMinor: isSalary ? (monthlySalaryMinor ?? undefined) : undefined,
        assetType: isAsset ? assetType.trim() : undefined,
        assetValueMinor: isAsset ? (assetValueMinor ?? undefined) : undefined,
        idempotencyKey: createIdempotencyKey(),
      });
      draft.setProductVersionId(productVersionId);
      draft.setTerms({
        amountMinor,
        tenor,
        purpose: purpose.trim(),
        employerName: employerName.trim(),
        monthlySalaryMinor,
        assetType: assetType.trim(),
        assetValueMinor,
      });
      draft.setQuote(quote);
      router.push({ pathname: "/loans/[loanType]/review", params: { loanType } });
    } catch (quoteError) {
      setError(quoteError instanceof ApiError ? quoteError.message : "We couldn't get a quote right now. Please try again.");
    } finally {
      setIsQuoting(false);
    }
  }

  return (
    <FormScreenLayout title={LOAN_TYPE_TITLES[loanType] ?? "Apply for a loan"} errorMessage={error} footer={<Button label="Continue" onPress={handleContinue} disabled={!canContinue} loading={isQuoting} />}>
      <TextField value={amountNaira} onChangeText={setAmountNaira} placeholder="Amount (₦)" keyboardType="decimal-pad" autoFocus />
      <TextField value={tenorText} onChangeText={setTenorText} placeholder="Tenure (days)" keyboardType="number-pad" />
      <TextField value={purpose} onChangeText={setPurpose} placeholder="Purpose" />
      {isSalary ? (
        <>
          <TextField value={employerName} onChangeText={setEmployerName} placeholder="Employer name" />
          <TextField value={monthlySalaryNaira} onChangeText={setMonthlySalaryNaira} placeholder="Monthly salary (₦)" keyboardType="decimal-pad" />
        </>
      ) : null}
      {isAsset ? (
        <>
          <TextField value={assetType} onChangeText={setAssetType} placeholder="Asset type" />
          <TextField value={assetValueNaira} onChangeText={setAssetValueNaira} placeholder="Asset value (₦)" keyboardType="decimal-pad" />
        </>
      ) : null}
    </FormScreenLayout>
  );
}
