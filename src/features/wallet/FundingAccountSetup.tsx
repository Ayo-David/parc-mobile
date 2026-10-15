import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBanks } from "@/api/queries/useBanks";
import { Button } from "@/components/Button/Button";
import { LabeledField } from "@/components/LabeledField/LabeledField";
import { PickerField } from "@/components/PickerField/PickerField";
import { TextField } from "@/components/TextField/TextField";
import { useTheme } from "@/theme";

const BVN_PATTERN = /^[0-9]{11}$/;
const ACCOUNT_NUMBER_PATTERN = /^[0-9]{10}$/;

export interface FundingAccountSetupProps {
  /** From `fundingAccountSetupState`: never requested, being opened, or declined. */
  state: "none" | "pending" | "rejected";
  /** The server's reason when `state` is "rejected". */
  rejectionMessage?: string | null;
}

/**
 * Shown on Add Money until the customer has a Parc account number. Paystack
 * must validate the customer's BVN against a bank account in their name
 * before it opens one. The BVN verified at onboarding is held server side, so
 * this asks only for the bank account — plus the BVN when the server answers
 * BVN_REQUIRED (customers who onboarded before BVNs were kept). Nothing is
 * stored on the device; the account arrives asynchronously and the
 * funding-details query polls while it's "pending".
 * No Figma frame exists for this step; it composes existing form components.
 */
export function FundingAccountSetup({ state, rejectionMessage }: FundingAccountSetupProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const banks = useBanks();
  const [bvn, setBvn] = useState("");
  const [bankCode, setBankCode] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [needsBvn, setNeedsBvn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = (!needsBvn || BVN_PATTERN.test(bvn)) && !!bankCode && ACCOUNT_NUMBER_PATTERN.test(accountNumber);
  const bankOptions = (banks.data ?? []).map((bank) => ({ value: bank.bankCode, label: bank.bankName }));

  async function handleSubmit() {
    if (!canSubmit || !bankCode) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.requestWalletVirtualAccount({ ...(needsBvn ? { bvn } : {}), bankCode, accountNumber, idempotencyKey: createIdempotencyKey() });
      setBvn("");
      setAccountNumber("");
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.code === "BVN_REQUIRED") setNeedsBvn(true);
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't start setting up your account number. Please try again.");
    } finally {
      setIsSubmitting(false);
      await queryClient.invalidateQueries({ queryKey: ["wallet-funding-details"] });
    }
  }

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.card,
      gap: theme.semanticSpacing.component,
    },
    pending: {
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    title: {
      ...theme.typography.text15Bold,
      color: theme.colors.textPrimary,
    },
    body: {
      ...theme.typography.text13Regular,
      color: theme.colors.textMuted,
    },
    centeredText: {
      textAlign: "center",
    },
    error: {
      ...theme.typography.text13Regular,
      color: theme.colors.error,
    },
  });

  if (state === "pending") {
    return (
      <View style={[styles.card, styles.pending]} accessibilityLiveRegion="polite">
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={[styles.title, styles.centeredText]}>Setting up your account number</Text>
        <Text style={[styles.body, styles.centeredText]}>We&apos;re confirming your details with our banking partner. This usually takes under a minute.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Get your Parc account number</Text>
      <Text style={styles.body}>
        Add a bank account in your name. Our banking partner checks it against the BVN you verified when you signed up.
      </Text>
      {state === "rejected" && rejectionMessage ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {rejectionMessage}
        </Text>
      ) : null}
      {needsBvn ? (
        <LabeledField label="BVN" trailingHelper={`${bvn.length}/11`}>
          <TextField
            value={bvn}
            onChangeText={(value) => setBvn(value.replace(/[^0-9]/g, ""))}
            placeholder="12345678901"
            keyboardType="number-pad"
            maxLength={11}
            textVariant="figure"
          />
        </LabeledField>
      ) : null}
      <LabeledField label="Bank">
        <PickerField placeholder={banks.isLoading ? "Loading banks…" : "Select your bank"} options={bankOptions} selectedValue={bankCode} searchable onSelect={(option) => setBankCode(option.value)} />
      </LabeledField>
      <LabeledField label="Account number" trailingHelper={`${accountNumber.length}/10`}>
        <TextField
          value={accountNumber}
          onChangeText={(value) => setAccountNumber(value.replace(/[^0-9]/g, ""))}
          placeholder="0123456789"
          keyboardType="number-pad"
          maxLength={10}
          textVariant="figure"
        />
      </LabeledField>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Button label="Get my account number" onPress={() => void handleSubmit()} disabled={!canSubmit} loading={isSubmitting} />
    </View>
  );
}
