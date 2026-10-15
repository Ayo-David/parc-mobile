import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { isWalletNotProvisioned } from "@/api/errors";
import { useDashboard } from "@/api/queries/useDashboard";
import { useProfile } from "@/api/queries/useProfile";
import { useTransactions } from "@/api/queries/useTransactions";
import { useWalletFundingDetails } from "@/api/queries/useWalletFundingDetails";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TransactionRow } from "@/components/TransactionRow/TransactionRow";
import { WalletBalanceCard } from "@/components/WalletBalanceCard/WalletBalanceCard";
import { useTheme } from "@/theme";

function useGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Figma "HomeScreen" (node 226:2865 / masked-balance state 226:3306),
 * under the "Parc Dashboard" section (326:968) — see redesign.md "Track B".
 * Real "Misc 06 — Degraded Dashboard Section" state (440:152,
 * missing-mobile.md §3) preserved for an unavailable loans/savings
 * section. GET /v1/dashboard only returns wallet balance + section
 * availability flags — account details and recent transactions are
 * separate composed queries (useWalletFundingDetails, useTransactions).
 *
 * Two Figma elements are NOT implemented here because the data doesn't
 * exist on any confirmed contract yet (see redesign.md "Track B" gaps):
 * the "Personal Loan" teaser card (needs an outstanding-amount +
 * next-payment-date field the dashboard/sections schema doesn't have),
 * and TxRow counterparty/category text (TransactionPage has no
 * merchant/category field — TransactionRow substitutes credit/debit +
 * date, see its own doc comment).
 */
// Figma "Misc 06 — Degraded Dashboard Section" (440:182–440:183): section-specific copy,
// no raw error code shown to the customer (section.error_code is for support/logs only).
const DEGRADED_SECTION_COPY: Record<string, { title: string; body: string }> = {
  loans: { title: "Loan details are temporarily delayed", body: "Your loans may take a few minutes to appear." },
  savings: { title: "Savings details are temporarily delayed", body: "Your savings may take a few minutes to appear." },
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const dashboard = useDashboard();
  const profile = useProfile();
  const fundingDetails = useWalletFundingDetails();
  const transactions = useTransactions();
  const greeting = useGreeting();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const dashboardData = dashboard.data;
  const fundingDetailsData = fundingDetails.data;
  const profileData = profile.data;

  const fullName = [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ") || "there";
  const initials =
    [profileData?.first_name, profileData?.last_name]
      .filter(Boolean)
      .map((part) => part![0]!.toUpperCase())
      .join("") || "?";
  const recentTransactions = transactions.data?.pages[0]?.items.slice(0, 4) ?? [];

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: theme.semanticSpacing.component,
      paddingBottom: theme.semanticSpacing.card,
    },
    greeting: {
      ...theme.typography.text13Medium,
      color: theme.colors.textMuted,
    },
    name: {
      ...theme.typography.text18ExtraBold,
      color: theme.colors.textPrimary,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    bellButton: {
      width: 40,
      height: 40,
      borderRadius: theme.radii.avatar,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primarySubtle,
    },
    bellDot: {
      position: "absolute",
      top: 9,
      right: 8,
      width: 7,
      height: 7,
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.secondary,
      borderWidth: theme.borderWidth.thin,
      borderColor: theme.colors.primarySubtle,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: theme.radii.avatar,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
    },
    avatarLabel: {
      ...theme.typography.text14ExtraBold,
      color: theme.colors.onPrimary,
    },
    degradedBanner: {
      backgroundColor: theme.components.status.warning.backgroundColor,
      borderRadius: theme.radii.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md + theme.spacing.xs / 2,
      gap: theme.spacing.sm - theme.spacing.xs / 2,
      marginTop: theme.semanticSpacing.form,
    },
    degradedTitleRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
    degradedTitle: { ...theme.typography.text13SemiBold, color: theme.colors.warningStrong, flex: 1 },
    degradedBody: { ...theme.typography.caption, color: theme.colors.warningMuted },
    emptyTransactions: { ...theme.typography.caption, color: theme.colors.textSecondary, paddingTop: theme.spacing.md },
    quickActionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: theme.semanticSpacing.card,
    },
    quickAction: {
      alignItems: "center",
      gap: 7,
    },
    quickActionIcon: {
      width: 52,
      height: 52,
      borderRadius: theme.radii.quickAction,
      alignItems: "center",
      justifyContent: "center",
    },
    quickActionLabel: {
      ...theme.typography.text11p5SemiBold,
      color: theme.colors.textSecondary,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: theme.semanticSpacing.card,
    },
    sectionTitle: {
      ...theme.typography.text15Bold,
      color: theme.colors.textPrimary,
    },
    sectionLink: {
      ...theme.typography.text13SemiBold,
      color: theme.colors.secondary,
    },
    servicesRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.md,
    },
    serviceChip: {
      flex: 1,
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm + 2,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.primarySubtle,
    },
    serviceLabel: {
      ...theme.typography.text10p5Bold,
      color: theme.colors.textPrimary,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    settingUpTitle: {
      ...theme.typography.text15Bold,
      color: theme.colors.textPrimary,
      textAlign: "center",
      marginTop: theme.semanticSpacing.component,
    },
    settingUpBody: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textMuted,
      textAlign: "center",
      marginTop: theme.spacing.sm,
    },
    errorText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.error,
      textAlign: "center",
      marginBottom: theme.semanticSpacing.component,
    },
  });

  if (dashboard.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (isWalletNotProvisioned(dashboard.error)) {
    return (
      <ScreenContainer>
        <View style={styles.centered} accessibilityLiveRegion="polite">
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.settingUpTitle}>Setting up your wallet</Text>
          <Text style={styles.settingUpBody}>This only takes a few seconds.</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (dashboard.isError || !dashboardData) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={styles.errorText}>We couldn&apos;t load your dashboard. Pull down to retry.</Text>
          <Button label="Retry" onPress={() => dashboard.refetch()} />
        </View>
      </ScreenContainer>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { wallet, sections } = dashboardData;

  const quickActions: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; bg: string; iconColor: string; onPress: () => void }[] = [
    { key: "add-money", label: "Add Money", icon: "add", bg: theme.colors.primary, iconColor: theme.colors.onPrimary, onPress: () => router.push("/add-money") },
    { key: "send", label: "Send", icon: "arrow-up-outline", bg: theme.colors.secondarySubtle, iconColor: theme.colors.secondary, onPress: () => router.push("/transfers") },
    { key: "history", label: "History", icon: "receipt-outline", bg: theme.colors.primarySubtle, iconColor: theme.colors.textPrimary, onPress: () => router.push("/transactions") },
    { key: "more", label: "More", icon: "ellipsis-horizontal", bg: theme.colors.primarySubtle, iconColor: theme.colors.textPrimary, onPress: () => router.push("/statement") },
  ];

  const quickServices: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
    { key: "airtime", label: "Airtime", icon: "call-outline", route: "/bills/airtime" },
    { key: "data", label: "Data", icon: "wifi-outline", route: "/bills/data" },
    { key: "electric", label: "Electric", icon: "flash-outline", route: "/bills/electricity" },
    { key: "cable_tv", label: "Cable TV", icon: "tv-outline", route: "/bills/cable_tv" },
  ];

  return (
    <ScreenContainer>
      <ScrollView refreshControl={<RefreshControl refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()} />} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.name}>{fullName}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.bellButton} onPress={() => router.push("/notifications")} accessibilityRole="button" accessibilityLabel="Notifications">
              <Ionicons name="notifications-outline" size={theme.icon.compact} color={theme.colors.textPrimary} />
              <View style={styles.bellDot} />
            </Pressable>
            <View style={styles.avatar}>
              <Text style={styles.avatarLabel}>{initials}</Text>
            </View>
          </View>
        </View>

        {fundingDetailsData && (
          <WalletBalanceCard
            balance={wallet.available_balance}
            accountNumber={fundingDetailsData.account_number}
            bankName={fundingDetailsData.bank_name}
            accountName={fundingDetailsData.account_name}
            isBalanceVisible={isBalanceVisible}
            onToggleVisibility={() => setIsBalanceVisible((v) => !v)}
          />
        )}

        {Object.entries(sections)
          .filter(([, section]) => !section.available)
          .map(([name, section]) => (
            <View key={name} style={styles.degradedBanner}>
              <View style={styles.degradedTitleRow}>
                <Ionicons name="warning-outline" size={theme.icon.nav} color={theme.colors.warningStrong} />
                <Text style={styles.degradedTitle}>{DEGRADED_SECTION_COPY[name]?.title ?? "Some details are temporarily delayed"}</Text>
              </View>
              <Text style={styles.degradedBody}>
                {DEGRADED_SECTION_COPY[name]?.body ?? "Some details may take a few minutes to appear."} Your balance is up to date and unaffected.
              </Text>
            </View>
          ))}

        <View style={styles.quickActionsRow}>
          {quickActions.map((action) => (
            <Pressable key={action.key} style={styles.quickAction} onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon} size={22} color={action.iconColor} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
          <Pressable onPress={() => router.push("/bills/airtime")} accessibilityRole="button">
            <Text style={styles.sectionLink}>All Services</Text>
          </Pressable>
        </View>
        <View style={styles.servicesRow}>
          {quickServices.map((service) => (
            <Pressable key={service.key} style={styles.serviceChip} onPress={() => router.push(service.route as never)} accessibilityRole="button" accessibilityLabel={service.label}>
              <Ionicons name={service.icon} size={14} color={theme.colors.textPrimary} />
              <Text style={styles.serviceLabel}>{service.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Pressable onPress={() => router.push("/transactions")} accessibilityRole="button">
            <Text style={styles.sectionLink}>See All</Text>
          </Pressable>
        </View>
        {recentTransactions.length === 0 ? (
          <Text style={styles.emptyTransactions}>No transactions yet.</Text>
        ) : (
          recentTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
