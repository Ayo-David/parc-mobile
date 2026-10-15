import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ApiError } from "@/api/errors";
import { useBanks } from "@/api/queries/useBanks";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ErrorState } from "@/components/ErrorState/ErrorState";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { avatarColorFor, initialsFor } from "@/features/beneficiaries/fieldProbe";
import { useTransferDraftStore } from "@/features/transfers/transferDraftStore";
import { useTheme } from "@/theme";

/**
 * Figma "Select Bank" (230:4221): BackHeader, white search field, one white
 * card listing banks with initials tiles. Tile colours come from the theme
 * (deterministic per bank name) rather than Figma's per-bank brand hexes,
 * which would hard-code third-party branding.
 */
export default function BankPickerScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const banks = useBanks();
  const setBank = useTransferDraftStore((state) => state.setBank);
  const [search, setSearch] = useState("");
  const palette = [theme.colors.secondary, theme.colors.surfaceInverse, theme.colors.success, theme.colors.info, theme.colors.warning];

  const filteredBanks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!banks.data) return [];
    return query ? banks.data.filter((bank) => bank.bankName.toLowerCase().includes(query)) : banks.data;
  }, [banks.data, search]);

  const styles = StyleSheet.create({
    searchField: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm + 2,
      backgroundColor: theme.colors.surface,
      borderWidth: theme.borderWidth.thin,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.input,
      paddingHorizontal: theme.spacing.md + 2,
      marginBottom: theme.spacing.md,
    },
    searchInput: { ...theme.typography.text14Regular, color: theme.colors.textPrimary, flex: 1, paddingVertical: theme.spacing.md + 1 },
    listCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.radii.card - 2, paddingHorizontal: theme.spacing.lg, ...theme.elevation.xs, marginBottom: theme.spacing.lg },
    row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md + 2, paddingVertical: theme.spacing.md, borderBottomWidth: theme.borderWidth.hairline, borderBottomColor: theme.colors.primarySubtle },
    badge: { width: theme.control.backButton, height: theme.control.backButton, borderRadius: theme.radii.input, alignItems: "center", justifyContent: "center" },
    badgeText: { ...theme.typography.text10Bold, color: theme.colors.textInverse },
    rowText: { ...theme.typography.text15Regular, color: theme.colors.textPrimary, flex: 1 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: theme.spacing.xl },
    emptyText: { ...theme.typography.text13Regular, color: theme.colors.textMuted },
  });

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <BackHeader title="Select Bank" />
      <View style={styles.searchField}>
        <Ionicons name="search" size={theme.icon.inline + 2} color={theme.colors.textMuted} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search banks..." placeholderTextColor={theme.colors.textMuted} autoCorrect={false} accessibilityLabel="Search banks" />
      </View>
      {banks.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : banks.isError ? (
        // Distinct from an empty search: the bank list itself couldn't be loaded.
        <ErrorState
          tone={banks.error instanceof ApiError && banks.error.category === "network" ? "network" : "error"}
          body="We couldn't load the list of banks. Transfers to other banks aren't available right now."
          onRetry={() => void banks.refetch()}
        />
      ) : (
        <View style={styles.listCard}>
          <FlatList
            data={filteredBanks}
            keyExtractor={(item) => item.bankCode}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => {
                  setBank(item.bankCode, item.bankName);
                  router.back();
                }}
                accessibilityRole="button"
                accessibilityLabel={item.bankName}
              >
                <View style={[styles.badge, { backgroundColor: avatarColorFor(item.bankName, palette) }]}>
                  <Text style={styles.badgeText}>{initialsFor(item.bankName)}</Text>
                </View>
                <Text style={styles.rowText} numberOfLines={1}>
                  {item.bankName}
                </Text>
                <Ionicons name="chevron-forward" size={theme.icon.inline + 2} color={theme.colors.textDisabled} />
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>No banks match “{search.trim()}”.</Text>
              </View>
            }
          />
        </View>
      )}
    </ScreenContainer>
  );
}
