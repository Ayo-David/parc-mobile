import { useState } from "react";
import { Linking, StyleSheet, Text } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useStatement } from "@/api/queries/useStatement";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useTheme } from "@/theme";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Figma "Download Statement". Both statement endpoints are contract gaps
 * (PLAN.md Part 4/7/"Real blockers"): the request's 202 response doesn't
 * document returning an id, and the status endpoint doesn't document its
 * response shape at all. Both are defensively probed in api/client.ts —
 * this screen shows the honest outcome either way rather than assuming
 * success. No date-picker component exists yet in this project, so dates
 * are entered as plain YYYY-MM-DD text for now.
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
    statusText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
    },
  });

  if (statementId) {
    return (
      <FormScreenLayout title="Your statement">
        {statement.data?.status === "ready" && statement.data.downloadUrl ? (
          <Button label="Download PDF" onPress={() => Linking.openURL(statement.data!.downloadUrl!)} />
        ) : statement.data?.status === "failed" ? (
          <Text style={styles.statusText}>Statement generation failed. Please try again.</Text>
        ) : (
          <Text style={styles.statusText}>Preparing your statement…</Text>
        )}
      </FormScreenLayout>
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
