import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useStatement } from "@/api/queries/useStatement";
import { useWalletFundingDetails } from "@/api/queries/useWalletFundingDetails";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { Button } from "@/components/Button/Button";
import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { PERIODS, periodRange, type Period } from "@/features/statements/periodRange";
import { useTheme } from "@/theme";

/**
 * Figma "Download Statement" (231:6896): account card, Statement Period
 * 2×2 grid, File Format, request button — plus the generating/failed states
 * (439:586/439:618). Backed by parc-ledger via POST/GET /v1/statements
 * (shapes confirmed in its source). Only PDF exists (Figma's .JPG option is
 * omitted). A READY statement carries a storage `download_reference`, not a
 * URL, and no route lets the app turn it into a file yet — the ready state
 * says so rather than offering a download that can't work.
 */
export default function StatementScreen() {
  const { theme } = useTheme();
  const funding = useWalletFundingDetails();
  const [period, setPeriod] = useState<Period>("this_month");
  const [statementId, setStatementId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const statement = useStatement(statementId);

  async function handleRequest() {
    setIsRequesting(true);
    setRequestError(null);
    try {
      const { statementId: id } = await api.requestStatement({ ...periodRange(period), idempotencyKey: createIdempotencyKey() });
      setStatementId(id);
    } catch (error) {
      setRequestError(error instanceof ApiError && error.category === "network" ? "We couldn't reach Parc. Check your connection and try again." : "We couldn't request your statement. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  }

  const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing.lg },
    accountCard: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radii.card - 2, padding: theme.spacing.lg, ...theme.elevation.xs },
    accountIcon: { width: theme.control.buttonSmall + 2, height: theme.control.buttonSmall + 2, borderRadius: theme.radii.md, backgroundColor: theme.colors.primarySubtle, alignItems: "center", justifyContent: "center" },
    accountName: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    accountMeta: { ...theme.typography.text12Regular, color: theme.colors.textMuted, marginTop: theme.spacing.xs / 2 },
    sectionLabel: { ...theme.typography.text13SemiBold, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm + 2 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
    option: { width: "48.5%", alignItems: "center", paddingVertical: theme.spacing.md + 1, borderRadius: theme.radii.input, borderWidth: theme.borderWidth.thin, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
    optionSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    optionLabel: { ...theme.typography.text13SemiBold, color: theme.colors.textPrimary },
    optionLabelSelected: { color: theme.colors.textInverse },
    formatOption: { width: "48.5%", alignItems: "center", paddingVertical: theme.spacing.lg, borderRadius: theme.radii.input, borderWidth: theme.borderWidth.thin, borderColor: theme.colors.primary, backgroundColor: theme.colors.surface },
    formatLabel: { ...theme.typography.text15Bold, color: theme.colors.textPrimary },
    note: { ...theme.typography.text12Regular, color: theme.colors.textMuted, marginTop: theme.spacing.sm },
    error: { ...theme.typography.text12Regular, color: theme.colors.error },
    footer: { paddingVertical: theme.spacing.md },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.semanticSpacing.component, paddingHorizontal: theme.semanticSpacing.section },
    title: { ...theme.typography.h3, color: theme.colors.textPrimary, textAlign: "center" },
    body: { ...theme.typography.text14Regular, color: theme.colors.textSecondary, textAlign: "center" },
  });

  const status = statement.data?.status;
  const periodLabel = PERIODS.find((option) => option.value === period)?.label ?? "";

  if (statementId && (status === "failed" || status === "expired")) {
    return (
      <StatusScreenLayout
        icon="alert-circle-outline"
        tone="error"
        title={status === "expired" ? "Statement expired" : "Couldn't generate statement"}
        body={status === "expired" ? "This statement is no longer available. Request a new one." : "Something went wrong while preparing your statement. Please try again, or choose a shorter period."}
        onBack={() => setStatementId(null)}
        footer={<Button label="Try again" onPress={() => setStatementId(null)} />}
      />
    );
  }

  if (statementId && status === "ready") {
    return (
      <StatusScreenLayout
        icon="document-text-outline"
        tone="primary"
        title="Your statement is ready"
        body={`Your ${periodLabel.toLowerCase()} statement has been generated. Downloading it in the app isn't available yet — please contact support to receive a copy.`}
        onBack={() => setStatementId(null)}
        footer={<Button label="Done" onPress={() => setStatementId(null)} />}
      />
    );
  }

  if (statementId) {
    return (
      <ScreenContainer>
        <BackHeader title="Download Statement" onBack={() => setStatementId(null)} />
        <View style={styles.centered}>
          <LoadingSpinner />
          <Text style={styles.title}>Generating your statement</Text>
          <Text style={styles.body}>This usually takes less than a minute. You can leave this screen — the request will continue.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <BackHeader title="Download Statement" />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {funding.data ? (
          <View style={styles.accountCard}>
            <View style={styles.accountIcon}>
              <Ionicons name="download-outline" size={theme.icon.compact} color={theme.colors.textPrimary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.accountName} numberOfLines={1}>
                {funding.data.account_name}
              </Text>
              <Text style={styles.accountMeta}>
                {funding.data.account_number} · {funding.data.bank_name}
              </Text>
            </View>
          </View>
        ) : null}

        <View>
          <Text style={styles.sectionLabel}>Statement Period</Text>
          <View style={styles.grid} accessibilityRole="radiogroup">
            {PERIODS.map((option) => {
              const isSelected = option.value === period;
              return (
                <Pressable key={option.value} style={[styles.option, isSelected && styles.optionSelected]} onPress={() => setPeriod(option.value)} accessibilityRole="radio" accessibilityState={{ selected: isSelected }}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>File Format</Text>
          <View style={styles.grid}>
            <View style={styles.formatOption} accessibilityRole="radio" accessibilityState={{ selected: true }}>
              <Text style={styles.formatLabel}>.PDF</Text>
            </View>
          </View>
          <Text style={styles.note}>
            {periodRange(period).dateFrom} to {periodRange(period).dateTo}
          </Text>
        </View>
        {requestError ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {requestError}
          </Text>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Request PDF Statement" onPress={handleRequest} loading={isRequesting} />
      </View>
    </ScreenContainer>
  );
}
