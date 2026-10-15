import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useTransferBeneficiaries } from "@/api/queries/useTransferBeneficiaries";
import type { BeneficiaryKind, BeneficiaryView } from "@/api/schemas";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { avatarColorFor, initialsFor } from "@/features/beneficiaries/fieldProbe";
import { useTransferDraftStore } from "@/features/transfers/transferDraftStore";
import { useTheme } from "@/theme";

const ACCOUNT_NUMBER_PATTERN = /^[0-9]{10}$/;

const TABS: { kind: BeneficiaryKind; label: string }[] = [
  { kind: "recent", label: "Recent" },
  { kind: "favourite", label: "Favourites" },
];

/**
 * Figma "Transfer To Bank Account" (230:3958 empty, 230:4649 verified).
 * Account number → bank → automatic name enquiry → green verified-name pill
 * → Next. The Recent/Favourites card lists real saved recipients from
 * GET /v1/beneficiaries?kind=recent|favourite; tapping one fills the form
 * and re-verifies it (a fresh enquiry token is required for the quote).
 * Figma's "Free transfers for the day" banner is omitted — no free-transfer
 * allowance exists anywhere in the contract.
 */
export default function TransferAccountEntryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { bankCode, bankName, accountNumber, accountName, setAccount, setBank } = useTransferDraftStore();
  const [localAccountNumber, setLocalAccountNumber] = useState(accountNumber ?? "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [tab, setTab] = useState<BeneficiaryKind>("recent");
  const beneficiaries = useTransferBeneficiaries(tab);

  const isValidAccountNumber = ACCOUNT_NUMBER_PATTERN.test(localAccountNumber);
  const isVerified = !!accountName && accountNumber === localAccountNumber;
  const palette = [theme.colors.secondary, theme.colors.surfaceInverse, theme.colors.success, theme.colors.info, theme.colors.warning];

  useEffect(() => {
    if (!isValidAccountNumber || !bankCode || localAccountNumber === accountNumber) {
      return;
    }
    let cancelled = false;
    async function verify(code: string, number: string) {
      setIsVerifying(true);
      setError(null);
      setAccountNotFound(false);
      try {
        const { accountName: verifiedName, enquiryToken } = await api.enquireTransferAccountName({ bankCode: code, accountNumber: number, idempotencyKey: createIdempotencyKey() });
        if (cancelled) return;
        if (verifiedName) {
          setAccount(number, verifiedName, enquiryToken);
        } else {
          setError("We couldn't confirm this account. Please check the details.");
        }
      } catch (enquiryError) {
        if (cancelled) return;
        if (enquiryError instanceof ApiError && enquiryError.category === "validation") {
          setAccountNotFound(true);
        } else if (enquiryError instanceof ApiError && enquiryError.category === "network") {
          setError("We couldn't reach Parc. Check your connection and try again.");
        } else {
          setError("We couldn't verify this account right now. Please try again later.");
        }
      } finally {
        if (!cancelled) setIsVerifying(false);
      }
    }
    void verify(bankCode, localAccountNumber);
    return () => {
      cancelled = true;
    };
    // Re-run only when the inputs to the enquiry change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAccountNumber, bankCode]);

  function selectBeneficiary(beneficiary: BeneficiaryView) {
    if (!beneficiary.account_number || !beneficiary.bank_code) return;
    setBank(beneficiary.bank_code, beneficiary.bank_name ?? beneficiary.bank_code);
    setLocalAccountNumber(beneficiary.account_number);
  }

  const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingBottom: theme.spacing.lg, gap: theme.spacing.md + 2 },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.card,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg + 2,
      ...theme.elevation.xs,
    },
    cardTitle: { ...theme.typography.text14Bold, color: theme.colors.textPrimary, marginBottom: theme.spacing.md + 2 },
    accountField: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      borderWidth: theme.borderWidth.thin,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.input,
      paddingHorizontal: theme.spacing.md + 2,
      height: theme.control.buttonMedium,
    },
    accountInput: { ...theme.typography.text16Bold, color: theme.colors.textPrimary, flex: 1, padding: 0, fontVariant: ["tabular-nums"] },
    clearButton: {
      width: theme.spacing.xxl + 2,
      height: theme.spacing.xxl + 2,
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.borderSubtle,
      alignItems: "center",
      justifyContent: "center",
    },
    bankRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderWidth: theme.borderWidth.thin,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.input,
      paddingHorizontal: theme.spacing.md + 2,
      paddingVertical: theme.spacing.md,
    },
    bankBadge: { width: theme.control.buttonSmall - 4, height: theme.control.buttonSmall - 4, borderRadius: theme.radii.md - 1, alignItems: "center", justifyContent: "center" },
    bankBadgeText: { ...theme.typography.text10Bold, color: theme.colors.textInverse },
    bankName: { ...theme.typography.text15Regular, color: bankName ? theme.colors.textPrimary : theme.colors.textMuted, flex: 1 },
    status: { marginTop: theme.spacing.md, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
    statusText: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    verifiedPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm + 2,
      marginTop: theme.spacing.md,
      backgroundColor: theme.components.status.success.backgroundColor,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md + 2,
      paddingVertical: theme.spacing.md - 1,
    },
    verifiedIcon: { width: theme.spacing.xl + 2, height: theme.spacing.xl + 2, borderRadius: theme.radii.sm, backgroundColor: theme.colors.success, alignItems: "center", justifyContent: "center" },
    verifiedName: { ...theme.typography.text14ExtraBold, color: theme.colors.successStrong, textTransform: "uppercase", flex: 1 },
    error: { ...theme.typography.text12Regular, color: theme.colors.error, marginTop: theme.spacing.md },
    nextWrap: { marginTop: theme.spacing.md },
    listCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.card, overflow: "hidden", ...theme.elevation.xs },
    tabs: { flexDirection: "row", borderBottomWidth: theme.borderWidth.hairline, borderBottomColor: theme.colors.divider },
    tab: { flex: 1, alignItems: "center", paddingVertical: theme.spacing.md + 1, borderBottomWidth: theme.borderWidth.otpBox, borderBottomColor: "transparent" },
    tabActive: { borderBottomColor: theme.colors.secondary },
    tabLabel: { ...theme.typography.text13Bold, color: theme.colors.textMuted },
    tabLabelActive: { color: theme.colors.textPrimary },
    beneficiaryRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: theme.borderWidth.hairline, borderBottomColor: theme.colors.background },
    avatar: { width: theme.control.buttonSmall + 2, height: theme.control.buttonSmall + 2, borderRadius: theme.radii.full, alignItems: "center", justifyContent: "center" },
    avatarText: { ...theme.typography.text13ExtraBold, color: theme.colors.textInverse },
    beneficiaryText: { flex: 1 },
    beneficiaryName: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    beneficiaryMeta: { ...theme.typography.text12Regular, color: theme.colors.textMuted, marginTop: theme.spacing.xs / 2 },
    listMessage: { ...theme.typography.text12Regular, color: theme.colors.textMuted, textAlign: "center", paddingVertical: theme.spacing.xl, paddingHorizontal: theme.spacing.lg },
    historyLink: { ...theme.typography.text13Bold, color: theme.colors.secondary, paddingHorizontal: theme.spacing.xs },
  });

  if (accountNotFound) {
    return (
      <StatusScreenLayout
        icon="person-remove-outline"
        tone="error"
        title="We couldn't find that account"
        body={`Double-check the account number and bank — ${localAccountNumber} doesn't match a valid account at ${bankName ?? "the selected bank"}.`}
        onBack={() => setAccountNotFound(false)}
        footer={<Button label="Edit details" onPress={() => setAccountNotFound(false)} />}
      />
    );
  }

  const bankInitials = bankName ? initialsFor(bankName) : null;
  const list = beneficiaries.data ?? [];

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <BackHeader
        title="Transfer To Bank Account"
        right={
          <Pressable onPress={() => router.push("/transactions")} accessibilityRole="link" hitSlop={8}>
            <Text style={styles.historyLink}>History</Text>
          </Pressable>
        }
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recipient Account</Text>
            <View style={styles.accountField}>
              <TextInput
                style={styles.accountInput}
                value={localAccountNumber}
                onChangeText={(text) => setLocalAccountNumber(text.replace(/[^0-9]/g, ""))}
                placeholder="Enter account number"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="number-pad"
                maxLength={10}
                accessibilityLabel="Recipient account number"
              />
              {localAccountNumber.length > 0 ? (
                <Pressable style={styles.clearButton} onPress={() => setLocalAccountNumber("")} accessibilityRole="button" accessibilityLabel="Clear account number" hitSlop={8}>
                  <Ionicons name="close" size={theme.icon.inline - 2} color={theme.colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <Pressable style={styles.bankRow} onPress={() => router.push("/transfers/bank-picker")} accessibilityRole="button" accessibilityLabel={bankName ? `Bank: ${bankName}. Change bank` : "Select bank"}>
              {bankInitials && bankName ? (
                <View style={[styles.bankBadge, { backgroundColor: avatarColorFor(bankName, palette) }]}>
                  <Text style={styles.bankBadgeText}>{bankInitials}</Text>
                </View>
              ) : null}
              <Text style={styles.bankName} numberOfLines={1}>
                {bankName ?? "Select Bank"}
              </Text>
              <Ionicons name="chevron-forward" size={theme.icon.inline + 2} color={theme.colors.textDisabled} />
            </Pressable>

            {isVerifying ? (
              <View style={styles.status}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.statusText}>Verifying account…</Text>
              </View>
            ) : null}
            {isVerified ? (
              <View style={styles.verifiedPill} accessibilityLiveRegion="polite">
                <View style={styles.verifiedIcon}>
                  <Ionicons name="checkmark" size={theme.icon.inline - 1} color={theme.colors.textInverse} />
                </View>
                <Text style={styles.verifiedName} numberOfLines={1}>
                  {accountName}
                </Text>
              </View>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.nextWrap}>
              <Button label="Next" onPress={() => router.push("/transfers/amount")} disabled={!isVerified} />
            </View>
          </View>

          <View style={styles.listCard}>
            <View style={styles.tabs} accessibilityRole="tablist">
              {TABS.map((option) => {
                const isActive = option.kind === tab;
                return (
                  <Pressable key={option.kind} style={[styles.tab, isActive && styles.tabActive]} onPress={() => setTab(option.kind)} accessibilityRole="tab" accessibilityState={{ selected: isActive }}>
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {beneficiaries.isLoading ? (
              <ActivityIndicator style={{ paddingVertical: theme.spacing.xl }} color={theme.colors.primary} />
            ) : beneficiaries.isError ? (
              <Text style={styles.listMessage}>Saved recipients aren&apos;t available right now.</Text>
            ) : list.length === 0 ? (
              <Text style={styles.listMessage}>{tab === "recent" ? "People you send money to will appear here." : "Recipients you mark as favourite will appear here."}</Text>
            ) : (
              list.map((beneficiary) => (
                <Pressable key={beneficiary.id} style={styles.beneficiaryRow} onPress={() => selectBeneficiary(beneficiary)} accessibilityRole="button" accessibilityLabel={`Send to ${beneficiary.name}`}>
                  <View style={[styles.avatar, { backgroundColor: avatarColorFor(beneficiary.name, palette) }]}>
                    <Text style={styles.avatarText}>{initialsFor(beneficiary.nickname ?? beneficiary.name)}</Text>
                  </View>
                  <View style={styles.beneficiaryText}>
                    <Text style={styles.beneficiaryName} numberOfLines={1}>
                      {beneficiary.nickname ?? beneficiary.name}
                    </Text>
                    <Text style={styles.beneficiaryMeta} numberOfLines={1}>
                      {[beneficiary.account_number, beneficiary.bank_name].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={theme.icon.inline} color={theme.colors.textDisabled} />
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
