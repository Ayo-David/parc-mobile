import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { useDashboard } from "@/api/queries/useDashboard";
import { Button } from "@/components/Button/Button";
import { MoneyText } from "@/components/MoneyText/MoneyText";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useAuth } from "@/auth/useAuth";
import { useTheme } from "@/theme";

/**
 * Figma "HomeScreen" (node 226:2865). GET /v1/dashboard only returns wallet
 * balance + loans/savings section-availability flags (verified against the
 * actual BFF route, not the richer shape mobile-flow-map_planning.md
 * originally envisioned) — the account-number/recent-transactions/loan
 * teaser parts of this screen need separate composed queries and are
 * deferred to their own backlog items (PLAN.md Part 6, items 4/5/7).
 */
export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const dashboard = useDashboard();
  const { logout } = useAuth();

  const styles = StyleSheet.create({
    header: {
      paddingTop: theme.semanticSpacing.section,
      marginBottom: theme.semanticSpacing.section,
    },
    greeting: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
    },
    balanceCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.card,
      ...theme.elevation.sm,
      marginBottom: theme.semanticSpacing.section,
    },
    balanceLabel: {
      ...theme.typography.label,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.xs,
    },
    sectionRow: {
      flexDirection: "row",
      gap: theme.semanticSpacing.form,
      marginBottom: theme.semanticSpacing.section,
    },
    sectionChip: {
      flex: 1,
      borderRadius: theme.radii.md,
      padding: theme.semanticSpacing.form,
    },
    sectionChipText: {
      ...theme.typography.caption,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
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
      <ScreenContainer hasFloatingTabBar>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <ScreenContainer hasFloatingTabBar>
        <View style={styles.centered}>
          <Text style={styles.errorText}>We couldn't load your dashboard. Pull down to retry.</Text>
          <Button label="Retry" onPress={() => dashboard.refetch()} />
        </View>
      </ScreenContainer>
    );
  }

  const { wallet, sections } = dashboard.data;

  return (
    <ScreenContainer hasFloatingTabBar>
      <ScrollView refreshControl={<RefreshControl refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()} />} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <MoneyText money={wallet.available_balance} />
        </View>
        <View style={styles.sectionRow}>
          {Object.entries(sections).map(([name, section]) => (
            <View
              key={name}
              style={[
                styles.sectionChip,
                { backgroundColor: section.available ? theme.components.status.success.backgroundColor : theme.components.status.warning.backgroundColor },
              ]}
            >
              <Text style={[styles.sectionChipText, { color: section.available ? theme.components.status.success.textColor : theme.components.status.warning.textColor }]}>
                {name[0]?.toUpperCase()}
                {name.slice(1)}: {section.available ? "Available" : "Temporarily unavailable"}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ gap: theme.semanticSpacing.form }}>
          <Button label="Send money" onPress={() => router.push("/transfers")} />
          <Button label="Buy airtime" variant="secondary" onPress={() => router.push("/bills/airtime")} />
          <Button label="Buy data" variant="secondary" onPress={() => router.push("/bills/data")} />
          <Button label="Pay electricity" variant="secondary" onPress={() => router.push("/bills/electricity")} />
          <Button label="TV Subscription" variant="secondary" onPress={() => router.push("/bills/cable_tv")} />
          <Button label="View transactions" variant="secondary" onPress={() => router.push("/transactions")} />
          <Button label="Download statement" variant="ghost" onPress={() => router.push("/statement")} />
          <Button label="Log out" variant="ghost" onPress={logout} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
