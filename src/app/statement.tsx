import { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useStatement } from "@/api/queries/useStatement";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useTheme } from "@/theme";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Figma "Download Statement", now including its real "Misc 04/05 —
 * Statement Generating/Failed" states (nodes 439:586/439:618,
 * missing-mobile.md §9) instead of plain inline status text. Both
 * statement endpoints remain contract gaps (PLAN.md Part 4/7/"Real
 * blockers"): the request's 202 response doesn't document returning an
 * id, and the status endpoint doesn't document its response shape at
 * all. Both are defensively probed in api/client.ts — this screen shows
 * the honest outcome either way rather than assuming success. No
 * date-picker component exists yet in this project, so dates are entered
 * as plain YYYY-MM-DD text for now.
 */
export default function StatementScreen() {
  const { theme } = useTheme();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statementId, setStatementId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [idMissing, setIdMissing] = useState(false);

  const statement = useStatement(statementId);
  const canRequest = DATE_PATTERN.test(dateFrom) && DATE_PATTERN.test(dateTo);

  async function handleRequest() {
    setIsRequesting(true);
    setRequestError(null);
    setIdMissing(false);
    try {
      const { statementId: id } = await api.requestStatement({ dateFrom, dateTo, idempotencyKey: createIdempotencyKey() });
      if (id) {
        setStatementId(id);
      } else {
        setIdMissing(true);
      }
    } catch (error) {
      setRequestError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  }

  const styles = StyleSheet.create({
    note: {
      ...theme.typography.bodySmall,
      color: theme.colors.warning,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.semanticSpacing.component,
      paddingHorizontal: theme.semanticSpacing.section,
    },
    title: { ...theme.typography.h3, color: theme.colors.textPrimary, textAlign: "center" },
    body: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary, textAlign: "center" },
  });

  if (statementId) {
    if (statement.data?.status === "failed") {
      return (
        <StatusScreenLayout
          icon="alert-circle-outline"
          tone="error"
          title="Couldn't generate statement"
          body="Something went wrong while preparing your statement. Please try again, or choose a shorter date range."
          onBack={() => setStatementId(null)}
          footer={<Button label="Try again" onPress={() => setStatementId(null)} />}
        />
      );
    }

    if (statement.data?.status === "ready" && statement.data.downloadUrl) {
      return (
        <FormScreenLayout title="Your statement">
          <Button label="Download PDF" onPress={() => Linking.openURL(statement.data!.downloadUrl!)} />
        </FormScreenLayout>
      );
    }

    return (
      <ScreenContainer>
        <View style={styles.content}>
          <LoadingSpinner />
          <Text style={styles.title}>Generating your statement</Text>
          <Text style={styles.body}>This usually takes less than a minute. We&apos;ll notify you when it&apos;s ready to download.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <FormScreenLayout
      title="Download statement"
      subtitle="Enter a date range (YYYY-MM-DD)."
      errorMessage={requestError}
      footer={<Button label="Generate PDF" onPress={handleRequest} disabled={!canRequest} loading={isRequesting} />}
    >
      <TextField value={dateFrom} onChangeText={setDateFrom} placeholder="From (YYYY-MM-DD)" keyboardType="numbers-and-punctuation" />
      <TextField value={dateTo} onChangeText={setDateTo} placeholder="To (YYYY-MM-DD)" keyboardType="numbers-and-punctuation" />
      {idMissing ? <Text style={styles.note}>Statement was requested, but this build couldn't retrieve an id to check its status (undocumented API response) — check back from Statements later.</Text> : null}
    </FormScreenLayout>
  );
}
