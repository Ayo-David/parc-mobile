import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { useTransactions } from "@/api/queries/useTransactions";
import type { TransactionStatus } from "@/api/schemas";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TransactionRow } from "@/components/TransactionRow/TransactionRow";
import { useTheme } from "@/theme";

const FILTERS: Array<{ label: string; value: TransactionStatus | undefined }> = [
  { label: "All", value: undefined },
  { label: "Posted", value: "posted" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Reversed", value: "reversed" },
];

/**
 * Figma "Transaction History" — filters here are limited to the real
 * `status` enum (pending/posted/failed/reversed) because that's the only
 * filterable field the confirmed TransactionPage schema exposes; there's no
 * credits/debits/bills "type" field to filter on like the original Figma
 * tabs implied (PLAN.md Part 4/7).
 */
export default function TransactionHistoryScreen() {
  const { theme } = useTheme();
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | undefined>(undefined);
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useTransactions({ status: statusFilter });

  const transactions = data?.pages.flatMap((page) => page.items) ?? [];

  const styles = StyleSheet.create({
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
      paddingTop: theme.semanticSpacing.section,
      marginBottom: theme.semanticSpacing.component,
    },
    filterRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginBottom: theme.semanticSpacing.component,
    },
    filterChip: {
      borderRadius: theme.radii.full,
      borderWidth: 1,
      paddingHorizontal: theme.semanticSpacing.form,
      paddingVertical: theme.spacing.xs,
    },
    filterLabel: {
      ...theme.typography.label,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
    errorText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.error,
      textAlign: "center",
    },
  });

  return (
    <ScreenContainer>
      <Text style={styles.title}>Transactions</Text>
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => {
          const isActive = filter.value === statusFilter;
          return (
            <Pressable
              key={filter.label}
              onPress={() => setStatusFilter(filter.value)}
              style={[styles.filterChip, { borderColor: isActive ? theme.colors.primary : theme.colors.border, backgroundColor: isActive ? theme.colors.primarySubtle : theme.colors.surface }]}
            >
              <Text style={[styles.filterLabel, { color: isActive ? theme.colors.primary : theme.colors.textSecondary }]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>We couldn't load your transactions. Pull down to retry.</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionRow transaction={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: theme.spacing.md }} /> : null}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No transactions yet.</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
