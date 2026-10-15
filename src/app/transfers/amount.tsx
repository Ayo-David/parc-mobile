import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { avatarColorFor, initialsFor } from "@/features/beneficiaries/fieldProbe";
import { useTransferDraftStore } from "@/features/transfers/transferDraftStore";
import { useTheme } from "@/theme";
import { formatMoney, parseMajorUnitsToMinor } from "@/utils/money";

const AMOUNT_PATTERN = /^[1-9][0-9]*$/;

// Figma 230:5205 preset grid and 230:5233 remark chips — shortcuts only.
const PRESET_NAIRA = ["500", "1000", "2000", "5000", "9999", "10000"];
const REMARK_CHIPS = ["Purchase", "Personal", "Rent", "Business"];

/**
 * Figma "Transfer To Bank Account" amount step (230:4922 empty, 230:5133
 * filled): recipient summary, hero amount with presets, optional remark with
 * quick chips, Confirm. Fees (Figma's "Stamp Duty" line) are never computed
 * client-side (parc-interview-answers.md §8): the server quote runs on
 * Confirm and its fee is shown on the review screen before anything is sent.
 */
export default function TransferAmountScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { accountName, accountNumber, bankName, currency, setAmount } = useTransferDraftStore();
  const [amountNaira, setAmountNaira] = useState("");
  const [narration, setNarration] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountMinor = parseMajorUnitsToMinor(amountNaira) ?? "";
  const isValidAmount = AMOUNT_PATTERN.test(amountMinor);
  const palette = [theme.colors.secondary, theme.colors.surfaceInverse, theme.colors.success, theme.colors.info, theme.colors.warning];

  async function handleConfirm() {
    const draft = useTransferDraftStore.getState();
    if (!draft.enquiryToken) {
      setError("The recipient needs to be verified again. Go back and re-enter the account details.");
      return;
    }
    setIsQuoting(true);
    setError(null);
    try {
      const { quoteId, feeMinor } = await api.quoteTransfer({ enquiryToken: draft.enquiryToken, amountMinor, currency, narration: narration.trim() || undefined });
      setAmount(amountMinor, narration.trim(), quoteId, feeMinor);
      router.push("/transfers/review");
    } catch (quoteError) {
      setError(
        quoteError instanceof ApiError && quoteError.category === "network"
          ? "We couldn't reach Parc. Check your connection and try again."
          : quoteError instanceof ApiError && quoteError.category === "validation"
            ? quoteError.message
            : "We couldn't prepare this transfer right now. Please try again later.",
      );
    } finally {
      setIsQuoting(false);
    }
  }

  const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingBottom: theme.spacing.lg, gap: theme.spacing.md },
    card: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.card - 2, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.lg + 2, ...theme.elevation.xs },
    recipientCard: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md + 2, backgroundColor: theme.colors.surface, borderRadius: theme.radii.card - 2, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md + 2, ...theme.elevation.xs },
    avatar: { width: theme.control.iconButton, height: theme.control.iconButton, borderRadius: theme.radii.full, alignItems: "center", justifyContent: "center" },
    avatarText: { ...theme.typography.text14ExtraBold, color: theme.colors.textInverse },
    recipientName: { ...theme.typography.text15ExtraBold, color: theme.colors.textPrimary, textTransform: "uppercase" },
    recipientMeta: { ...theme.typography.text12Regular, color: theme.colors.textMuted, marginTop: theme.spacing.xs / 2 },
    cardTitle: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    amountRow: { flexDirection: "row", alignItems: "center", marginTop: theme.spacing.md + 2, paddingBottom: theme.spacing.sm + 2, borderBottomWidth: theme.borderWidth.otpBox, borderBottomColor: theme.colors.textPrimary },
    amountPrefix: { ...theme.typography.text28ExtraBoldFigure, color: theme.colors.textPrimary, marginRight: theme.spacing.xs },
    amountInput: { ...theme.typography.text28ExtraBoldFigure, color: theme.colors.textPrimary, flex: 1, padding: 0 },
    clearButton: { width: theme.spacing.xxl + 4, height: theme.spacing.xxl + 4, borderRadius: theme.radii.full, backgroundColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
    feeNote: { ...theme.typography.text12Regular, color: theme.colors.textMuted, marginTop: theme.spacing.sm + 2 },
    presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginTop: theme.spacing.md + 2 },
    preset: {
      width: "31.5%",
      alignItems: "center",
      paddingVertical: theme.spacing.sm + 2,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.background,
      borderWidth: theme.borderWidth.thin,
      borderColor: "transparent",
    },
    presetSelected: { backgroundColor: theme.colors.disabledSurface, borderColor: theme.colors.textPrimary },
    presetLabel: { ...theme.typography.text13Bold, color: theme.colors.textPrimary, fontVariant: ["tabular-nums"] },
    remarkInput: { ...theme.typography.text14Regular, color: theme.colors.textPrimary, paddingVertical: theme.spacing.sm, marginTop: theme.spacing.sm },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginTop: theme.spacing.sm },
    chip: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm - 1, borderRadius: theme.radii.full, backgroundColor: theme.colors.background, borderWidth: theme.borderWidth.thin, borderColor: "transparent" },
    chipSelected: { borderColor: theme.colors.textPrimary },
    chipLabel: { ...theme.typography.text13SemiBold, color: theme.colors.textPrimary },
    error: { ...theme.typography.text12Regular, color: theme.colors.error },
    footer: { paddingVertical: theme.spacing.md },
  });

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <BackHeader title="Transfer To Bank Account" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {accountName ? (
            <View style={styles.recipientCard}>
              <View style={[styles.avatar, { backgroundColor: avatarColorFor(bankName ?? accountName, palette) }]}>
                <Text style={styles.avatarText}>{initialsFor(bankName ?? accountName)}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.recipientName} numberOfLines={1}>
                  {accountName}
                </Text>
                <Text style={styles.recipientMeta}>{[accountNumber, bankName].filter(Boolean).join(" ")}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.amountPrefix}>₦</Text>
              <TextInput
                style={styles.amountInput}
                value={amountNaira}
                onChangeText={setAmountNaira}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textDisabled}
                keyboardType="decimal-pad"
                accessibilityLabel="Amount in naira"
              />
              {amountNaira.length > 0 ? (
                <Pressable style={styles.clearButton} onPress={() => setAmountNaira("")} accessibilityRole="button" accessibilityLabel="Clear amount" hitSlop={8}>
                  <Ionicons name="close" size={theme.icon.inline - 2} color={theme.colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.feeNote}>Any fees are shown before you confirm.</Text>
            <View style={styles.presetGrid}>
              {PRESET_NAIRA.map((preset) => {
                const isSelected = amountNaira === preset;
                return (
                  <Pressable key={preset} style={[styles.preset, isSelected && styles.presetSelected]} onPress={() => setAmountNaira(preset)} accessibilityRole="button" accessibilityState={{ selected: isSelected }}>
                    <Text style={styles.presetLabel}>{formatMoney({ amount_minor: `${preset}00`, currency }).replace(/\.00$/, "")}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Remark</Text>
            <TextInput
              style={styles.remarkInput}
              value={narration}
              onChangeText={setNarration}
              placeholder="What's this for? (Optional)"
              placeholderTextColor={theme.colors.textDisabled}
              maxLength={140}
              accessibilityLabel="Remark"
            />
            <View style={styles.chipRow}>
              {REMARK_CHIPS.map((chip) => {
                const isSelected = narration === chip;
                return (
                  <Pressable key={chip} style={[styles.chip, isSelected && styles.chipSelected]} onPress={() => setNarration(chip)} accessibilityRole="button" accessibilityState={{ selected: isSelected }}>
                    <Text style={styles.chipLabel}>{chip}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Confirm" onPress={handleConfirm} disabled={!isValidAmount} loading={isQuoting} />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
