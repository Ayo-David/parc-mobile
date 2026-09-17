import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBillProducts } from "@/api/queries/useBillProducts";
import { useProfile } from "@/api/queries/useProfile";
import type { BillCategory, BillProduct } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useBillDraftStore } from "@/features/bills/billDraftStore";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

const CATEGORY_TITLES: Record<BillCategory, string> = {
  airtime: "Buy Airtime",
  data: "Buy Data",
  electricity: "Electricity",
  cable_tv: "TV Subscription",
  internet: "Internet",
};

/** Figma "Buy Airtime"/"Buy Data" — one generic screen parameterized by category. */
export default function BillProductScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: BillCategory }>();
  const products = useBillProducts(category);
  const profile = useProfile();
  const { product, customerIdentifier, setProduct, setCustomer } = useBillDraftStore();
  const [identifier, setIdentifier] = useState(customerIdentifier ?? "");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidIdentifier = /^[0-9]{10,15}$/.test(identifier);

  async function handleContinue() {
    if (!product || !profile.data) return;
    setIsValidating(true);
    setError(null);
    try {
      const validation = await api.validateBillCustomer({ customerId: profile.data.id, productId: product.id, customerIdentifier: identifier, idempotencyKey: createIdempotencyKey() });
      setCustomer(identifier, validation.customer_name);
      if (product.denomination_type === "FIXED" && product.amount_minor) {
        router.push({ pathname: "/bills/[category]/review", params: { category } });
      } else {
        router.push({ pathname: "/bills/[category]/amount", params: { category } });
      }
    } catch (validationError) {
      setError(validationError instanceof ApiError ? validationError.message : "We couldn't verify these details. Please check and try again.");
    } finally {
      setIsValidating(false);
    }
  }

  const styles = StyleSheet.create({
    row: {
      paddingVertical: theme.semanticSpacing.form,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    rowSelected: {
      backgroundColor: theme.colors.primarySubtle,
    },
    rowText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textPrimary,
    },
    rowPrice: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
    },
    listContainer: {
      maxHeight: 280,
      marginBottom: theme.semanticSpacing.component,
    },
  });

  return (
    <FormScreenLayout
      title={CATEGORY_TITLES[category] ?? "Pay bill"}
      errorMessage={error}
      footer={<Button label="Continue" onPress={handleContinue} disabled={!product || !isValidIdentifier || !profile.data} loading={isValidating} />}
    >
      <TextField value={identifier} onChangeText={setIdentifier} placeholder="Phone number" keyboardType="number-pad" />
      {products.isLoading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            data={products.data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: BillProduct }) => (
              <Pressable style={[styles.row, product?.id === item.id && styles.rowSelected]} onPress={() => setProduct(item)}>
                <Text style={styles.rowText}>{item.product_name}</Text>
                <Text style={styles.rowPrice}>{item.amount_minor ? formatMoney({ amount_minor: item.amount_minor, currency: "NGN" }) : "Any amount"}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </FormScreenLayout>
  );
}
