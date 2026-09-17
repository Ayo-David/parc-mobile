import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useBanks } from "@/api/queries/useBanks";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TextField } from "@/components/TextField/TextField";
import { useTransferDraftStore } from "@/features/transfers/transferDraftStore";
import { useTheme } from "@/theme";

/** Figma "Send Money — Bank Picker Screen". */
export default function BankPickerScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const banks = useBanks();
  const setBank = useTransferDraftStore((state) => state.setBank);
  const [search, setSearch] = useState("");

  const filteredBanks = useMemo(() => {
    if (!banks.data) return [];
    const query = search.trim().toLowerCase();
    return query ? banks.data.filter((bank) => bank.bankName.toLowerCase().includes(query)) : banks.data;
  }, [banks.data, search]);

  const styles = StyleSheet.create({
    header: {
      paddingTop: theme.semanticSpacing.section,
      marginBottom: theme.semanticSpacing.component,
    },
    row: {
      paddingVertical: theme.semanticSpacing.form,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    rowText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textPrimary,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textMuted,
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TextField value={search} onChangeText={setSearch} placeholder="Search banks" autoFocus />
      </View>
      {banks.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredBanks}
          keyExtractor={(item) => item.bankCode}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => {
                setBank(item.bankCode, item.bankName);
                router.back();
              }}
            >
              <Text style={styles.rowText}>{item.bankName}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No banks found.</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
