import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ApiError } from "@/api/errors";
import { useTransactions } from "@/api/queries/useTransactions";
import type { Transaction } from "@/api/schemas";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ErrorState } from "@/components/ErrorState/ErrorState";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TransactionRow } from "@/components/TransactionRow/TransactionRow";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

type TransactionFilter = "all" | "credits" | "debits" | "bills";

// Figma "Transaction History" (230:5739) filter pills.
const FILTERS: { label: string; value: TransactionFilter }[] = [
  { label: "All", value: "all" },
  { label: "Credits", value: "credits" },
  { label: "Debits", value: "debits" },
  { label: "Bills", value: "bills" },
];

function matchesFilter(transaction: Transaction, filter: TransactionFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "credits":
      return transaction.direction === "credit";
    case "debits":
      return transaction.direction === "debit";
    case "bills":
      return transaction.type === "BILL_PAYMENT";
  }
}

/**
 * Figma "Transaction History" (230:5739), under the "Parc Dashboard"
 * section (326:968). Payment serves the customer's newest 100 payments in
 * one response with no server-side filtering (see api.getTransactions), so
 * Figma's Credits/Debits/Bills pills and the search box both filter the
 * loaded list. Search matches narration, reference, amount, and date.
 */
export default function TransactionHistoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useTransactions();

  const transactions = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((transaction) => {
      if (!matchesFilter(transaction, filter)) return false;
      if (!query) return true;
      const haystack = [transaction.narration ?? "", transaction.reference, formatMoney(transaction.amount), new Date(transaction.occurred_at).toLocaleString()].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [transactions, search, filter]);

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md - 4,
      paddingTop: theme.semanticSpacing.component,
      paddingBottom: theme.spacing.md,
    },
    title: {
      ...theme.typography.text16Bold,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    statementButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs + 2,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs + 3,
      borderRadius: theme.radii.chip + 2,
      backgroundColor: theme.colors.primarySubtle,
    },
    statementLabel: {
      ...theme.typography.text12Bold,
      color: theme.colors.textSecondary,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm + 2,
      paddingHorizontal: theme.spacing.md + 2,
      height: 45,
      borderRadius: theme.radii.lg - 2,
      backgroundColor: theme.colors.primarySubtle,
      marginBottom: theme.spacing.md,
    },
    searchInputText: {
      ...theme.typography.text14Regular,
      color: theme.colors.textMuted,
      flex: 1,
    },
    filterRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    filterChip: {
      paddingHorizontal: theme.spacing.md,
      height: 34,
      borderRadius: theme.radii.chip,
      alignItems: "center",
      justifyContent: "center",
    },
    filterLabel: { ...theme.typography.text12Bold },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <BackHeader
        title="Transaction History"
        right={
          <Pressable style={styles.statementButton} onPress={() => router.push("/statement")} accessibilityRole="button" accessibilityLabel="Statement">
            <Ionicons name="download-outline" size={15} color={theme.colors.textSecondary} />
            <Text style={styles.statementLabel}>Statement</Text>
          </Pressable>
        }
      />

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={theme.colors.textMuted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search transactions..." placeholderTextColor={theme.colors.textMuted} style={styles.searchInputText} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((option) => {
          const isActive = option.value === filter;
          return (
            <Pressable
              key={option.label}
              onPress={() => setFilter(option.value)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? theme.colors.primary : theme.colors.primarySubtle,
                },
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterLabel,
                  {
                    color: isActive ? theme.colors.textInverse : theme.colors.textSecondary,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : isError ? (
        <ErrorState tone={error instanceof ApiError && error.category === "network" ? "network" : "error"} onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/disputes/[transactionId]",
                  params: {
                    transactionId: item.id,
                    amountMinor: item.amount.amount_minor,
                    currency: item.amount.currency,
                    occurredAt: item.occurred_at,
                    status: item.status,
                    reference: item.reference,
                  },
                })
              }
            >
              <TransactionRow transaction={item} />
            </Pressable>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: theme.spacing.md }} /> : null}
          ListEmptyComponent={<EmptyState emoji="💸" title="No transactions yet" body="Your transaction history will appear here once you start sending, receiving, or paying bills." />}
        />
      )}
    </ScreenContainer>
  );
}
