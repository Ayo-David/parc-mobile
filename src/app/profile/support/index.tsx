import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useFaqs } from "@/api/queries/useSupport";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TextField } from "@/components/TextField/TextField";
import { firstString } from "@/features/support/fieldProbe";
import { useTheme, withAlpha } from "@/theme";

/**
 * Figma "Support 01 — Help Home" (node 431:480, missing-mobile.md §8) —
 * this whole 4-screen Support flow is a confirmed-real, in-allowlist BFF
 * capability (`GET /v1/support/faqs`, `GET`/`POST /v1/support/tickets`)
 * that had zero dedicated screens before this phase, only a single
 * combined `profile/support.tsx`. Figma's "Browse by topic" category grid
 * is deliberately NOT built — there's no confirmed category/topic field
 * anywhere in the FAQ response (prose-only schema, "Effective published
 * tenant FAQ catalogue"), so those 4 topic tiles would be entirely
 * invented, not just placeholder styling.
 */
export default function SupportHelpHomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const faqs = useFaqs();
  const [query, setQuery] = useState("");

  const faqEntries = useMemo(() => faqs.data ?? [], [faqs.data]);
  const filteredFaqs = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return faqEntries;
    return faqEntries.filter((entry) => (firstString(entry, ["question", "title"]) ?? "").toLowerCase().includes(trimmed));
  }, [faqEntries, query]);

  const styles = StyleSheet.create({
    content: { paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.component, paddingBottom: theme.semanticSpacing.section },
    sectionLabel: { ...theme.typography.text15Bold, color: theme.colors.textPrimary },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: theme.semanticSpacing.form, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
    rowText: { ...theme.typography.text14Bold, color: theme.colors.textPrimary, flex: 1, marginRight: theme.spacing.sm },
    contactCard: {
      backgroundColor: theme.colors.surfaceInverse,
      borderRadius: theme.radii.lg,
      padding: theme.semanticSpacing.form,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    contactTitle: { ...theme.typography.text14Bold, color: theme.colors.textInverse },
    contactSubtitle: { ...theme.typography.text12Regular, color: withAlpha(theme.colors.textInverse, 0.5) },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (faqs.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: "Help & Support" }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TextField value={query} onChangeText={setQuery} placeholder="Search for help..." />

        <Text style={styles.sectionLabel}>{query.trim() ? "Results" : "Popular questions"}</Text>
        {filteredFaqs.length === 0 ? (
          <EmptyState emoji="❓" title="No FAQs found" body={query.trim() ? "Try a different search term." : "No FAQs are available right now."} />
        ) : (
          filteredFaqs.map((entry, index) => {
            const question = firstString(entry, ["question", "title"]) ?? `Question ${index + 1}`;
            const realIndex = faqEntries.indexOf(entry);
            return (
              <Pressable key={realIndex} style={styles.row} onPress={() => router.push({ pathname: "/profile/support/faq/[faqIndex]", params: { faqIndex: String(realIndex) } })}>
                <Text style={styles.rowText}>{question}</Text>
                <Ionicons name="chevron-forward" size={theme.icon.compact} color={theme.colors.textMuted} />
              </Pressable>
            );
          })
        )}

        <Pressable style={styles.contactCard} onPress={() => router.push("/profile/support/tickets")}>
          <Ionicons name="chatbubble-ellipses-outline" size={theme.icon.default} color={theme.colors.textInverse} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactSubtitle}>Contact our support team</Text>
          </View>
          <Ionicons name="chevron-forward" size={theme.icon.compact} color={theme.colors.textDisabled} />
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
