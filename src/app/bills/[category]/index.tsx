import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBillProducts } from "@/api/queries/useBillProducts";
import { useProfile } from "@/api/queries/useProfile";
import type { BillCategory, BillProduct } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ErrorState } from "@/components/ErrorState/ErrorState";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { avatarColorFor, initialsFor } from "@/features/beneficiaries/fieldProbe";
import { useBillDraftStore } from "@/features/bills/billDraftStore";
import { useTheme, withAlpha } from "@/theme";
import { formatMoney, parseMajorUnitsToMinor } from "@/utils/money";

const CATEGORY_TITLES: Record<BillCategory, string> = {
  airtime: "Airtime",
  data: "Mobile Data",
  electricity: "Electricity",
  cable_tv: "TV-Cable",
  internet: "Internet",
};

const CATEGORY_TAGLINES: Record<BillCategory, string> = {
  airtime: "Instant delivery to any Nigerian network",
  data: "Fast data plans, delivered instantly",
  electricity: "Direct disco meter connection, zero network charge",
  cable_tv: "Instant reconnect in seconds",
  internet: "Top up your internet subscription",
};

/** Figma "Bill 02 — Meter Verification Failed" (node 428:320) uses meter-specific wording; other categories get a generic identifier label. */
const IDENTIFIER_LABELS: Record<BillCategory, string> = {
  airtime: "phone number",
  data: "phone number",
  electricity: "meter number",
  cable_tv: "smartcard/IUC number",
  internet: "account number",
};

const IDENTIFIER_PLACEHOLDERS: Record<BillCategory, string> = {
  airtime: "Phone number",
  data: "Phone number",
  electricity: "Meter number",
  cable_tv: "Smartcard/IUC number",
  internet: "Account number",
};

/**
 * Round-number presets in minor units (₦100 – ₦20,000), filtered per
 * product to whatever falls inside its real `min_amount_minor`/
 * `max_amount_minor`. These are a UI convenience for a VARIABLE-amount
 * product — never a promotional/cashback claim (Figma's per-preset
 * "₦2 Cashback" badges and its "Claim 15 Discounts" banner are deliberately
 * not built here: no such field exists on `BillProduct`/`BillPayment`
 * anywhere in the confirmed contract, so displaying either would be
 * fabricating financial/promotional data, not closing a design gap).
 */
const PRESET_AMOUNTS_MINOR = ["10000", "20000", "50000", "100000", "200000", "500000", "1000000", "2000000"];

function presetsInRange(min?: string | null, max?: string | null): string[] {
  const lo = min ? BigInt(min) : 0n;
  const hi = max ? BigInt(max) : BigInt(PRESET_AMOUNTS_MINOR[PRESET_AMOUNTS_MINOR.length - 1]);
  return PRESET_AMOUNTS_MINOR.filter((amount) => {
    const value = BigInt(amount);
    return value >= lo && value <= hi;
  }).slice(0, 6);
}

/**
 * Figma "BillScreen" (233:9182 Airtime, 233:10159 Data, and the TV-Cable
 * 397:44/Electricity 399:811 flows re-pulled 2026-09-21). Those last two
 * are genuinely bespoke, heavier designs in Figma — search bar, category
 * filter tabs, a "recent smartcards" row, a prepaid/postpaid segmented
 * toggle, a verified-account-name badge, a voucher/redeem banner — none
 * of which map to a confirmed field on `BillProduct`/`BillPayment` (no
 * provider logo, no prepaid/postpaid split, no voucher concept, no
 * separate "verified name" lookup outside the one real
 * `validateBillCustomer` call). Building those would mean inventing
 * backend behavior, not translating a design. Instead every category
 * shares one real, data-driven layout: a hero banner, a provider selector
 * (chip row for products that are all `VARIABLE`, e.g. Airtime/
 * Electricity; a searchable card list for `FIXED` catalogues, e.g. Data/
 * TV-Cable), the real identifier field, and — only for the VARIABLE case
 * — an inline preset+custom amount section (the old separate `amount.tsx`
 * step is folded in here, since Figma's own Airtime/Electricity screens
 * show provider + number + amount on one screen, not a wizard). Provider
 * "badges" reuse the same colored-initials pattern as `/beneficiaries`
 * rather than fabricated brand logos — no real logo asset exists for
 * these products anywhere in the app.
 */
export default function BillProductScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: BillCategory }>();
  const products = useBillProducts(category);
  const productsData = useMemo(() => products.data ?? [], [products.data]);
  const profile = useProfile();
  const { product, customerIdentifier, setProduct, setCustomer, setQuote, reset: resetDraft } = useBillDraftStore();
  const [identifier, setIdentifier] = useState(customerIdentifier ?? "");
  const [amountNaira, setAmountNaira] = useState("");
  const [search, setSearch] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationFailed, setVerificationFailed] = useState(false);

  const isAllVariable = productsData.length > 0 && productsData.every((item) => item.denomination_type === "VARIABLE");

  // The draft store is shared across the whole bill wizard and only resets on completion
  // (success.tsx), so a product picked on a previously-visited category can otherwise
  // leak into this one — wrong min/max bounds, wrong identifier prefilled. Detect that and
  // start this category's draft fresh rather than trusting cross-category stale state.
  useEffect(() => {
    if (productsData.length === 0) return;
    const belongsToCategory = product ? productsData.some((item) => item.id === product.id) : false;
    if (!belongsToCategory) {
      resetDraft();
      setProduct(productsData[0]);
      setIdentifier("");
      setAmountNaira("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, productsData.length]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return productsData;
    return productsData.filter((item) => item.product_name.toLowerCase().includes(query));
  }, [productsData, search]);

  const presets = product ? presetsInRange(product.min_amount_minor, product.max_amount_minor) : [];
  const amountMinorValue = parseMajorUnitsToMinor(amountNaira);
  const isValidAmount =
    amountMinorValue !== null &&
    /^[1-9][0-9]*$/.test(amountMinorValue) &&
    (!product?.min_amount_minor || BigInt(amountMinorValue) >= BigInt(product.min_amount_minor)) &&
    (!product?.max_amount_minor || BigInt(amountMinorValue) <= BigInt(product.max_amount_minor));

  const isValidIdentifier = /^[0-9]{10,15}$/.test(identifier);

  async function handleContinue() {
    if (!product || !profile.data || !isValidIdentifier) return;
    if (isAllVariable && !isValidAmount) return;
    setIsValidating(true);
    setError(null);
    setVerificationFailed(false);
    try {
      const validation = await api.validateBillCustomer({ customerId: profile.data.id, productId: product.id, customerIdentifier: identifier, idempotencyKey: createIdempotencyKey() });
      setCustomer(identifier, validation.customer_name);
      if (isAllVariable && amountMinorValue) {
        const quote = await api.quoteBillPayment({ customerId: profile.data.id, productId: product.id, customerIdentifier: identifier, amountMinor: amountMinorValue, idempotencyKey: createIdempotencyKey() });
        setQuote(amountMinorValue, quote.quote_id, quote.total_debit_minor);
      }
      router.push({ pathname: "/bills/[category]/review", params: { category } });
    } catch (validationError) {
      if (validationError instanceof ApiError && validationError.category === "validation") {
        setVerificationFailed(true);
      } else {
        setError(validationError instanceof ApiError ? validationError.message : "We couldn't verify these details. Please check and try again.");
      }
    } finally {
      setIsValidating(false);
    }
  }

  const badgePalette = [theme.colors.secondary, theme.colors.primary, theme.colors.success, theme.colors.info, theme.colors.warning];
  const cardRecipe = theme.components.card;
  const heroGradient = theme.components.walletCard;

  const styles = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4, paddingTop: theme.semanticSpacing.component, paddingBottom: theme.spacing.sm },
    title: { ...theme.typography.text16Bold, color: theme.colors.textPrimary, flex: 1 },
    historyLabel: { ...theme.typography.text13Bold, color: theme.colors.secondary },
    hero: { borderRadius: theme.radii.card, padding: theme.semanticSpacing.card, marginTop: theme.spacing.sm, overflow: "hidden" },
    heroTitle: { ...theme.typography.text15ExtraBold, color: theme.colors.textInverse },
    heroSubtitle: { ...theme.typography.text12Regular, color: withAlpha(theme.colors.textInverse, 0.6), marginTop: theme.spacing.xs },
    errorText: { ...theme.typography.text12Regular, color: theme.colors.error, marginTop: theme.semanticSpacing.form },
    metersLink: { ...theme.typography.text12Bold, color: theme.colors.secondary, textAlign: "right", marginTop: theme.spacing.sm },
    chipRow: { flexDirection: "row", gap: theme.spacing.sm, paddingTop: theme.semanticSpacing.card, paddingBottom: theme.spacing.sm },
    providerChip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.radii.full, backgroundColor: theme.colors.surfaceAlt, borderWidth: theme.borderWidth.thin, borderColor: "transparent" },
    providerChipSelected: { backgroundColor: theme.colors.primarySubtle, borderColor: theme.colors.primary },
    providerChipLabel: { ...theme.typography.text12Bold, color: theme.colors.textSecondary },
    providerChipLabelSelected: { color: theme.colors.textPrimary },
    identifierRow: { marginTop: theme.spacing.sm },
    sectionCard: { backgroundColor: cardRecipe.backgroundColor, borderRadius: cardRecipe.radius, padding: cardRecipe.padding, marginTop: theme.semanticSpacing.card, ...cardRecipe.shadow },
    sectionLabel: { ...theme.typography.text15ExtraBold, color: theme.colors.textPrimary },
    searchField: { marginTop: theme.spacing.sm },
    presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginTop: theme.spacing.md },
    presetChip: { width: "31%", alignItems: "center", justifyContent: "center", paddingVertical: theme.spacing.md, borderRadius: theme.radii.lg, borderWidth: theme.borderWidth.thin, borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.background },
    presetChipSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySubtle },
    presetLabel: { ...theme.typography.text16ExtraBoldFigure, color: theme.colors.textPrimary },
    customAmountRow: { marginTop: theme.spacing.md },
    amountHelper: { ...theme.typography.text12Regular, color: theme.colors.textMuted, marginTop: theme.spacing.sm },
    productList: { marginTop: theme.spacing.md },
    productRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.semanticSpacing.form, borderRadius: theme.radii.lg, borderWidth: theme.borderWidth.thin, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm },
    productRowSelected: { backgroundColor: theme.colors.primarySubtle, borderColor: theme.colors.primary },
    productBadge: { width: 44, height: 44, borderRadius: theme.radii.avatar + 9, alignItems: "center", justifyContent: "center" },
    productBadgeLabel: { ...theme.typography.text13ExtraBold, color: theme.colors.textInverse },
    productInfo: { flex: 1, gap: 2 },
    productName: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    productPrice: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    emptyText: { ...theme.typography.text12Regular, color: theme.colors.textMuted, paddingVertical: theme.semanticSpacing.card },
    footer: { paddingTop: theme.semanticSpacing.component, paddingBottom: theme.semanticSpacing.component },
  });

  if (verificationFailed) {
    const identifierLabel = IDENTIFIER_LABELS[category] ?? "details";
    return (
      <StatusScreenLayout
        icon="card-outline"
        tone="error"
        title={`We couldn't verify that ${identifierLabel}`}
        body={`${identifier} doesn't match a valid ${identifierLabel}${product ? ` for ${product.product_name}` : ""}. Check the number and try again.`}
        onBack={() => setVerificationFailed(false)}
        footer={<Button label={`Edit ${identifierLabel}`} onPress={() => setVerificationFailed(false)} />}
      />
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <BackHeader
          title={CATEGORY_TITLES[category] ?? "Pay bill"}
          right={
            <Pressable onPress={() => router.push("/transactions")} accessibilityRole="link" accessibilityLabel="History" hitSlop={8}>
              <Text style={styles.historyLabel}>History</Text>
            </Pressable>
          }
        />

        <View style={styles.hero}>
          <LinearGradient colors={heroGradient.gradientColors} locations={heroGradient.gradientLocations} start={heroGradient.gradientStart} end={heroGradient.gradientEnd} style={StyleSheet.absoluteFill} />
          <Text style={styles.heroTitle}>Top-up your {CATEGORY_TITLES[category]} anytime, anywhere</Text>
          <Text style={styles.heroSubtitle}>{CATEGORY_TAGLINES[category]}</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {category === "electricity" ? (
          <Pressable onPress={() => router.push("/bills/electricity-beneficiaries")}>
            <Text style={styles.metersLink}>My Meters</Text>
          </Pressable>
        ) : null}

        {products.isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: theme.semanticSpacing.section }} />
        ) : products.isError ? (
          <ErrorState
            tone={products.error instanceof ApiError && products.error.category === "network" ? "network" : "error"}
            body="We couldn't load providers right now."
            onRetry={() => void products.refetch()}
          />
        ) : productsData.length === 0 ? (
          // The tenant's bill catalogue can legitimately be empty (nothing imported/published yet).
          <EmptyState emoji="🧾" title="No providers available yet" body="This service isn't available on your account right now. Please check back later." />
        ) : (
          <>
            {isAllVariable ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {productsData.map((item) => {
                  const selected = product?.id === item.id;
                  return (
                    <Pressable key={item.id} style={[styles.providerChip, selected && styles.providerChipSelected]} onPress={() => setProduct(item)} accessibilityRole="button" accessibilityLabel={item.product_name}>
                      <Text style={[styles.providerChipLabel, selected && styles.providerChipLabelSelected]}>{item.product_name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            <View style={styles.identifierRow}>
              <TextField value={identifier} onChangeText={setIdentifier} placeholder={IDENTIFIER_PLACEHOLDERS[category] ?? "Number"} keyboardType={category === "electricity" || category === "cable_tv" ? "number-pad" : "phone-pad"} />
            </View>

            {isAllVariable ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>Amount</Text>
                <View style={styles.presetGrid}>
                  {presets.map((presetMinor) => {
                    const selected = amountMinorValue === presetMinor;
                    return (
                      <Pressable
                        key={presetMinor}
                        style={[styles.presetChip, selected && styles.presetChipSelected]}
                        onPress={() => setAmountNaira((BigInt(presetMinor) / 100n).toString())}
                        accessibilityRole="button"
                      >
                        <Text style={styles.presetLabel}>{formatMoney({ amount_minor: presetMinor, currency: "NGN" })}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.customAmountRow}>
                  <TextField value={amountNaira} onChangeText={setAmountNaira} placeholder="Custom amount (₦)" keyboardType="decimal-pad" />
                </View>
                {product?.min_amount_minor && product?.max_amount_minor ? (
                  <Text style={styles.amountHelper}>
                    Min {formatMoney({ amount_minor: product.min_amount_minor, currency: "NGN" })} — Max {formatMoney({ amount_minor: product.max_amount_minor, currency: "NGN" })}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>{category === "data" ? "Data Plans" : "Choose a package"}</Text>
                {productsData.length > 4 ? (
                  <View style={styles.searchField}>
                    <TextField value={search} onChangeText={setSearch} placeholder="Search" />
                  </View>
                ) : null}
                <View style={styles.productList}>
                  {filteredProducts.length === 0 ? (
                    <Text style={styles.emptyText}>No plans match your search.</Text>
                  ) : (
                    filteredProducts.map((item: BillProduct) => {
                      const selected = product?.id === item.id;
                      return (
                        <Pressable key={item.id} style={[styles.productRow, selected && styles.productRowSelected]} onPress={() => setProduct(item)} accessibilityRole="button">
                          <View style={[styles.productBadge, { backgroundColor: avatarColorFor(item.product_name, badgePalette) }]}>
                            <Text style={styles.productBadgeLabel}>{initialsFor(item.product_name)}</Text>
                          </View>
                          <View style={styles.productInfo}>
                            <Text style={styles.productName}>{item.product_name}</Text>
                            {item.amount_minor ? <Text style={styles.productPrice}>{formatMoney({ amount_minor: item.amount_minor, currency: "NGN" })}</Text> : null}
                          </View>
                          {selected ? <Ionicons name="checkmark-circle" size={theme.icon.compact} color={theme.colors.primary} /> : null}
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </View>
            )}
          </>
        )}

        {productsData.length > 0 ? (
          <View style={styles.footer}>
            <Button label="Continue" onPress={handleContinue} disabled={!product || !isValidIdentifier || !profile.data || (isAllVariable && !isValidAmount)} loading={isValidating} />
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
