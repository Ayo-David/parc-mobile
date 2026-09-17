import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useTransferDraftStore } from "@/features/transfers/transferDraftStore";
import { useTheme } from "@/theme";

const ACCOUNT_NUMBER_PATTERN = /^[0-9]{10}$/;

/** Figma "Send Money — Account Entry Screen". */
export default function TransferAccountEntryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { bankCode, bankName, accountNumber, accountName, setAccount } = useTransferDraftStore();
  const [localAccountNumber, setLocalAccountNumber] = useState(accountNumber ?? "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidAccountNumber = ACCOUNT_NUMBER_PATTERN.test(localAccountNumber);

  useEffect(() => {
    if (!isValidAccountNumber || !bankCode || isVerifying || localAccountNumber === accountNumber) {
      return;
    }
    setIsVerifying(true);
    setError(null);
    api
      .enquireTransferAccountName({ bankCode, accountNumber: localAccountNumber, idempotencyKey: createIdempotencyKey() })
      .then(({ accountName: verifiedName, enquiryToken }) => {
        if (verifiedName) {
          setAccount(localAccountNumber, verifiedName, enquiryToken);
        } else {
          setError("We couldn't confirm this account (undocumented API response). Please check the details.");
        }
      })
      .catch((enquiryError) => setError(enquiryError instanceof ApiError ? enquiryError.message : "We couldn't verify this account. Please check the details."))
      .finally(() => setIsVerifying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAccountNumber, bankCode]);

  const styles = StyleSheet.create({
    bankRow: {
      height: theme.control.input,
      borderRadius: theme.radii.input,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.semanticSpacing.form,
      justifyContent: "center",
    },
    bankRowText: {
      ...theme.typography.bodyMedium,
      color: bankName ? theme.colors.textPrimary : theme.colors.textMuted,
    },
    verifiedName: {
      ...theme.typography.bodyMedium,
      fontWeight: "600",
      color: theme.colors.success,
    },
  });

  return (
    <FormScreenLayout
      title="Send money"
      subtitle="Enter the recipient's account details."
      errorMessage={error}
      footer={<Button label="Next" onPress={() => router.push("/transfers/amount")} disabled={!accountName || accountNumber !== localAccountNumber} />}
    >
      <Pressable style={styles.bankRow} onPress={() => router.push("/transfers/bank-picker")}>
        <Text style={styles.bankRowText}>{bankName ?? "Select Bank"}</Text>
      </Pressable>
      <TextField
        value={localAccountNumber}
        onChangeText={setLocalAccountNumber}
        placeholder="Account number"
        keyboardType="number-pad"
        maxLength={10}
      />
      {isVerifying ? <ActivityIndicator color={theme.colors.primary} /> : null}
      {accountName && accountNumber === localAccountNumber ? <Text style={styles.verifiedName}>{accountName}</Text> : null}
    </FormScreenLayout>
  );
}
