import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useFaqs } from "@/api/queries/useSupport";
import { Button } from "@/components/Button/Button";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { firstString } from "@/features/support/fieldProbe";
import { useTheme } from "@/theme";

/**
 * Figma "Support 02 — FAQ Answer" (node 431:579, missing-mobile.md §8).
 * Reads the same cached `useFaqs()` list by index rather than a stable id
 * — no `id` field is confirmed on a FAQ record, only best-effort
 * question/answer text probes. "Was this helpful?" is local-only UI state
 * (a thank-you message, nothing persisted) — no FAQ-feedback endpoint
 * exists anywhere in the confirmed contract.
 */
export default function FaqAnswerScreen() {
  const { theme } = useTheme();
  const { faqIndex } = useLocalSearchParams<{ faqIndex: string }>();
  const faqs = useFaqs();
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  const entry = faqs.data?.[Number(faqIndex)];

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.component },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    question: { ...theme.typography.text22ExtraBold, color: theme.colors.textPrimary },
    answer: { ...theme.typography.text14Regular, color: theme.colors.textSecondary },
    feedbackCard: { backgroundColor: theme.colors.background, borderRadius: theme.radii.lg, padding: theme.semanticSpacing.form, gap: theme.spacing.sm },
    feedbackTitle: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    feedbackRow: { flexDirection: "row", gap: theme.spacing.sm },
    feedbackButton: { flex: 1 },
    thanksText: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
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

  if (!entry) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.answer}>This question isn&apos;t available anymore.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const question = firstString(entry, ["question", "title"]) ?? "Question";
  const answer = firstString(entry, ["answer", "body"]) ?? "No answer available.";

  return (
    <ScreenContainer>
      <BackHeader title="FAQ" />
      <View style={styles.content}>
        <Text style={styles.question}>{question}</Text>
        <Text style={styles.answer}>{answer}</Text>
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>Was this helpful?</Text>
          {feedback ? (
            <Text style={styles.thanksText}>Thanks for letting us know!</Text>
          ) : (
            <View style={styles.feedbackRow}>
              <View style={styles.feedbackButton}>
                <Button label="Yes" variant="secondary" onPress={() => setFeedback("yes")} />
              </View>
              <View style={styles.feedbackButton}>
                <Button label="No" variant="secondary" onPress={() => setFeedback("no")} />
              </View>
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
