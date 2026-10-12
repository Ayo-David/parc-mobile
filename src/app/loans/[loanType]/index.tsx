import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useLoanSummary } from "@/api/queries/useLoanSummary";
import type { CustomerLoanQuote, LoanType, RepaymentFrequency } from "@/api/schemas";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TextField } from "@/components/TextField/TextField";
import { amountPresets, DAYS_PER_MONTH, formatRatePercent, tenureMonthOptions } from "@/features/loans/applicationOptions";
import { useLoanApplicationDraftStore } from "@/features/loans/loanApplicationDraftStore";
import { useTheme, withAlpha } from "@/theme";
import { formatMoney, formatMoneyCompact, parseMajorUnitsToMinor } from "@/utils/money";

const LOAN_TYPE_TITLES: Record<LoanType, string> = {
  INSTANT: "Instant Loan",
  UNSECURED_PERSONAL: "Personal Loan",
  SALARY_BACKED: "Salary Loan",
  ASSET_FINANCE: "Asset Finance",
};

const FREQUENCIES: { value: RepaymentFrequency; label: string; paymentLabel: string }[] = [
  { value: "daily", label: "Daily", paymentLabel: "Daily Payment" },
  { value: "weekly", label: "Weekly", paymentLabel: "Weekly Payment" },
  { value: "monthly", label: "Monthly", paymentLabel: "Monthly Payment" },
];

const QUOTE_DEBOUNCE_MS = 600;

/**
 * Figma "Personal Loan" form (237:12808; Instant/Asset/Salary variants
 * 237:12416, 238:13284, 238:14069 share the template). Bounds, amount
 * shortcuts and tenure choices come from the selected product in
 * GET /v1/loans/summary. The pink summary card (237:12915) shows the
 * server's own POST /v1/loans/quotes result for the current inputs —
 * refreshed after a short pause — so the client never computes interest
 * or instalments. Tenure is chosen in months (Figma) and sent as days
 * (`tenor`/`tenure_days`, confirmed in days on the live server: 90 days →
 * 3 monthly instalments). Figma's purpose dropdown has no backing list
 * anywhere in the contract, so purpose stays free text.
 */
export default function LoanProductScreen() {
  const { loanType, productVersionId } = useLocalSearchParams<{ loanType: LoanType; productVersionId: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  const draft = useLoanApplicationDraftStore();
  const summary = useLoanSummary();
  const product = summary.data?.eligibleProducts.find((candidate) => candidate.product_version_id === productVersionId);

  const [amountNaira, setAmountNaira] = useState("");
  const [tenureMonths, setTenureMonths] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<RepaymentFrequency>("monthly");
  const [purpose, setPurpose] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [monthlySalaryNaira, setMonthlySalaryNaira] = useState("");
  const [assetType, setAssetType] = useState("");
  const [assetValueNaira, setAssetValueNaira] = useState("");
  // Each quote outcome is tagged with the inputs it answered, and only shown
  // while those inputs are unchanged — no state reset needed when they change.
  const [quoteOutcome, setQuoteOutcome] = useState<{ key: string; quote: CustomerLoanQuote | null; error: string | null } | null>(null);
  const latestQuoteRequest = useRef(0);

  const isSalary = loanType === "SALARY_BACKED";
  const isAsset = loanType === "ASSET_FINANCE";
  const currency = product?.currency ?? "NGN";
  const amountMinor = parseMajorUnitsToMinor(amountNaira);
  const monthlySalaryMinor = parseMajorUnitsToMinor(monthlySalaryNaira);
  const assetValueMinor = parseMajorUnitsToMinor(assetValueNaira);
  const tenureDays = tenureMonths !== null ? tenureMonths * DAYS_PER_MONTH : null;

  const isAmountInRange = !!amountMinor && !!product && BigInt(amountMinor) >= BigInt(product.min_amount_minor) && BigInt(amountMinor) <= BigInt(product.max_amount_minor);
  const showAmountError = amountNaira.trim().length > 0 && !!product && !isAmountInRange;
  const extraFieldsReady = (!isSalary || (employerName.trim().length > 0 && !!monthlySalaryMinor)) && (!isAsset || (assetType.trim().length > 0 && !!assetValueMinor));
  const canQuote = isAmountInRange && tenureDays !== null && extraFieldsReady;
  const quoteKey = canQuote ? JSON.stringify([productVersionId, amountMinor, tenureDays, frequency, employerName.trim(), monthlySalaryMinor, assetType.trim(), assetValueMinor]) : null;
  const currentOutcome = quoteOutcome && quoteOutcome.key === quoteKey ? quoteOutcome : null;
  const quote = currentOutcome?.quote ?? null;
  const quoteError = currentOutcome?.error ?? null;
  const isQuoting = quoteKey !== null && currentOutcome === null;
  const canApply = canQuote && !!quote && purpose.trim().length >= 2;

  useEffect(() => {
    if (quoteKey === null || !amountMinor || tenureDays === null) return;
    const requestId = ++latestQuoteRequest.current;
    const timer = setTimeout(async () => {
      try {
        const result = await api.quoteLoan({
          productVersionId,
          amountMinor,
          currency,
          tenor: tenureDays,
          repaymentFrequency: frequency,
          employerName: isSalary ? employerName.trim() : undefined,
          monthlySalaryMinor: isSalary ? (monthlySalaryMinor ?? undefined) : undefined,
          assetType: isAsset ? assetType.trim() : undefined,
          assetValueMinor: isAsset ? (assetValueMinor ?? undefined) : undefined,
          idempotencyKey: createIdempotencyKey(),
        });
        if (requestId === latestQuoteRequest.current) setQuoteOutcome({ key: quoteKey, quote: result, error: null });
      } catch (error) {
        if (requestId === latestQuoteRequest.current) {
          setQuoteOutcome({ key: quoteKey, quote: null, error: error instanceof ApiError ? error.message : "We couldn't get a quote right now." });
        }
      }
    }, QUOTE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // quoteKey captures every input that changes the server's answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey]);

  function handleApply() {
    if (!canApply || !quote || !amountMinor || tenureDays === null) return;
    draft.setProductVersionId(productVersionId);
    draft.setTerms({
      amountMinor,
      tenor: tenureDays,
      repaymentFrequency: frequency,
      purpose: purpose.trim(),
      employerName: employerName.trim(),
      monthlySalaryMinor,
      assetType: assetType.trim(),
      assetValueMinor,
    });
    draft.setQuote(quote);
    router.push({ pathname: "/loans/[loanType]/review", params: { loanType } });
  }

  const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingBottom: theme.spacing.lg },
    amountCard: {
      backgroundColor: theme.colors.primarySubtle,
      borderRadius: theme.radii.card - 2,
      paddingHorizontal: theme.spacing.lg + 2,
      paddingVertical: theme.spacing.lg,
    },
    amountLabel: { ...theme.typography.text12SemiBold, color: theme.colors.textMuted },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: theme.spacing.sm + 2,
      paddingBottom: theme.spacing.sm + 2,
      borderBottomWidth: theme.borderWidth.strong,
      borderBottomColor: showAmountError ? theme.colors.error : theme.colors.textPrimary,
    },
    amountPrefix: { ...theme.typography.text30ExtraBoldMono, color: theme.colors.textPrimary, marginRight: theme.spacing.xs / 2 },
    amountInput: { ...theme.typography.text30ExtraBoldMono, color: theme.colors.textPrimary, flex: 1, padding: 0 },
    amountHelper: { ...theme.typography.text11p5Regular, color: showAmountError ? theme.colors.error : theme.colors.textDisabled, marginTop: theme.spacing.sm },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginTop: theme.spacing.md },
    amountChip: {
      paddingHorizontal: theme.spacing.md + 2,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.full,
      borderWidth: theme.borderWidth.otpBox,
      borderColor: theme.colors.borderSubtle,
      backgroundColor: theme.colors.surface,
    },
    sectionLabel: { ...theme.typography.text12Bold, color: theme.colors.textSecondary, marginTop: theme.semanticSpacing.card, marginBottom: theme.spacing.sm },
    tenureChip: {
      minWidth: theme.control.backButton,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm + 1,
      alignItems: "center",
      borderRadius: theme.radii.md,
      borderWidth: theme.borderWidth.otpBox,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    frequencyRow: { flexDirection: "row", gap: theme.spacing.sm },
    frequencyOption: {
      flex: 1,
      alignItems: "center",
      paddingVertical: theme.spacing.md - 1,
      borderRadius: theme.radii.button,
      borderWidth: theme.borderWidth.otpBox,
      borderColor: theme.colors.borderSubtle,
      backgroundColor: theme.colors.surface,
    },
    selected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    chipLabel: { ...theme.typography.text12Bold, color: theme.colors.textSecondary },
    optionLabel: { ...theme.typography.text14Bold, color: theme.colors.textSecondary },
    selectedLabel: { color: theme.colors.textInverse },
    fieldGap: { gap: theme.spacing.md },
    quoteCard: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.secondarySubtle,
      borderWidth: theme.borderWidth.thin,
      borderColor: withAlpha(theme.colors.secondary, 0.15),
      borderRadius: theme.radii.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md + 2,
      gap: theme.spacing.sm - 2,
    },
    quoteRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    quoteLabel: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    quoteInterest: { ...theme.typography.text13Bold, color: theme.colors.secondary },
    quotePayment: { ...theme.typography.text15BoldMono, color: theme.colors.textPrimary },
    quoteMessage: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    quoteError: { ...theme.typography.text12Regular, color: theme.colors.error },
    footer: { paddingTop: theme.spacing.md, paddingBottom: theme.spacing.md },
    applyButton: {
      height: theme.control.buttonMedium,
      borderRadius: theme.radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: canApply ? theme.colors.primary : theme.colors.disabledSurface,
    },
    applyLabel: { ...theme.typography.text15Bold, color: canApply ? theme.colors.textInverse : theme.colors.textDisabled },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.md },
    notice: { ...theme.typography.text14Regular, color: theme.colors.textMuted, textAlign: "center" },
  });

  const title = LOAN_TYPE_TITLES[loanType] ?? "Apply for a loan";

  if (!product) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ headerShown: false }} />
        <BackHeader title={title} />
        <View style={styles.centered}>
          {summary.isLoading ? <ActivityIndicator color={theme.colors.primary} /> : <Text style={styles.notice}>This loan product isn&apos;t available right now.</Text>}
        </View>
      </ScreenContainer>
    );
  }

  const presets = amountPresets(product.min_amount_minor, product.max_amount_minor);
  const tenureOptions = tenureMonthOptions(product.min_tenure_days, product.max_tenure_days);
  const frequencyLabel = FREQUENCIES.find((option) => option.value === frequency)?.paymentLabel ?? "Payment";
  const firstInstallment = quote?.schedule[0];

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <BackHeader title={title} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Loan Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.amountPrefix}>₦</Text>
              <TextInput
                style={styles.amountInput}
                value={amountNaira}
                onChangeText={setAmountNaira}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.textDisabled}
                accessibilityLabel="Loan amount in naira"
              />
            </View>
            <Text style={styles.amountHelper}>
              {showAmountError ? "Enter an amount between " : "Min "}
              {formatMoney({ amount_minor: product.min_amount_minor, currency })}
              {showAmountError ? " and " : " · Max "}
              {formatMoney({ amount_minor: product.max_amount_minor, currency })}
            </Text>
          </View>

          <View style={styles.chipRow}>
            {presets.map((preset) => {
              const isSelected = amountMinor === preset;
              return (
                <Pressable
                  key={preset}
                  style={[styles.amountChip, isSelected && styles.selected]}
                  onPress={() => setAmountNaira((BigInt(preset) / 100n).toString())}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.chipLabel, isSelected && styles.selectedLabel]}>{formatMoneyCompact({ amount_minor: preset, currency })}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Repayment Tenure (months)</Text>
          <View style={styles.chipRow}>
            {tenureOptions.map((months) => {
              const isSelected = tenureMonths === months;
              return (
                <Pressable key={months} style={[styles.tenureChip, isSelected && styles.selected]} onPress={() => setTenureMonths(months)} accessibilityRole="radio" accessibilityState={{ selected: isSelected }} accessibilityLabel={`${months} months`}>
                  <Text style={[styles.optionLabel, isSelected && styles.selectedLabel]}>{months}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Loan Purpose</Text>
          <TextField value={purpose} onChangeText={setPurpose} placeholder="e.g. Rent, school fees, business stock" />

          {isSalary ? (
            <>
              <Text style={styles.sectionLabel}>Employment</Text>
              <View style={styles.fieldGap}>
                <TextField value={employerName} onChangeText={setEmployerName} placeholder="Employer name" />
                <TextField value={monthlySalaryNaira} onChangeText={setMonthlySalaryNaira} placeholder="Monthly salary (₦)" keyboardType="decimal-pad" />
              </View>
            </>
          ) : null}
          {isAsset ? (
            <>
              <Text style={styles.sectionLabel}>Asset</Text>
              <View style={styles.fieldGap}>
                <TextField value={assetType} onChangeText={setAssetType} placeholder="Asset type" />
                <TextField value={assetValueNaira} onChangeText={setAssetValueNaira} placeholder="Asset value (₦)" keyboardType="decimal-pad" />
              </View>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>Repayment Frequency</Text>
          <View style={styles.frequencyRow}>
            {FREQUENCIES.map((option) => {
              const isSelected = option.value === frequency;
              return (
                <Pressable key={option.value} style={[styles.frequencyOption, isSelected && styles.selected]} onPress={() => setFrequency(option.value)} accessibilityRole="radio" accessibilityState={{ selected: isSelected }}>
                  <Text style={[styles.optionLabel, isSelected && styles.selectedLabel]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {canQuote || quoteError ? (
            <View style={styles.quoteCard} accessibilityLiveRegion="polite">
              {quoteError ? (
                <Text style={styles.quoteError}>{quoteError}</Text>
              ) : isQuoting || !quote || !firstInstallment ? (
                <Text style={styles.quoteMessage}>Getting your quote…</Text>
              ) : (
                <>
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>Interest ({formatRatePercent(product.annual_rate)} p.a.)</Text>
                    <Text style={styles.quoteInterest}>{formatMoney({ amount_minor: quote.totalInterestMinor, currency: quote.currency })}</Text>
                  </View>
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>{frequencyLabel}</Text>
                    <Text style={styles.quotePayment}>{formatMoney({ amount_minor: firstInstallment.total_minor, currency: quote.currency })}</Text>
                  </View>
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>Total repayable</Text>
                    <Text style={styles.quoteLabel}>{formatMoney({ amount_minor: quote.totalRepayableMinor, currency: quote.currency })}</Text>
                  </View>
                </>
              )}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.applyButton} onPress={handleApply} disabled={!canApply} accessibilityRole="button" accessibilityState={{ disabled: !canApply }}>
            <Text style={styles.applyLabel}>Apply Now</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
