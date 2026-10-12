import { useLocalSearchParams, useRouter } from "expo-router";

import { TransactionResultLayout } from "@/components/TransactionResultLayout/TransactionResultLayout";
import { useLoanApplicationDraftStore } from "@/features/loans/loanApplicationDraftStore";

/**
 * Figma "Loan Approved!" — reached only after a real `acceptLoanOffer`
 * call succeeds (see `offer.tsx`), not shown speculatively. `loanId` is
 * the real id `LoanOfferAcceptance` returns; there's no confirmed field
 * for the disbursed amount on that response, so this doesn't show one
 * rather than repeating the requested amount as if it were confirmed
 * disbursed.
 */
export default function LoanApprovedScreen() {
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const resetDraft = useLoanApplicationDraftStore((state) => state.reset);

  function handleDone() {
    resetDraft();
    router.replace("/(tabs)/loans");
  }

  return (
    <TransactionResultLayout
      tone="success"
      title="Loan Approved!"
      detailLines={["Your funds are on the way to your wallet.", `Loan reference: ${loanId}`]}
      primaryAction={{ label: "Done", onPress: handleDone }}
    />
  );
}
