import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { computeRequestHash } from "@/api/requestHash";
import { BottomSheet } from "@/components/BottomSheet/BottomSheet";
import { Button } from "@/components/Button/Button";
import { PinPad } from "@/components/PinPad/PinPad";
import { useTheme } from "@/theme";

const PIN_LENGTH = 4;

export interface TransactionPinSheetProps {
  visible: boolean;
  onClose: () => void;
  /** e.g. "TRANSFER", "BILL_PAYMENT" — identifies what's being authorized. */
  commandType: string;
  /** A stable identifier for the specific thing being authorized (see PLAN.md note on resource_id ambiguity). */
  resourceId: string;
  /** The exact fields being authorized — hashed via computeRequestHash to produce request_hash. */
  requestPayload: Record<string, unknown>;
  onAuthorized: (authorizationToken: string) => void;
}

/**
 * The single reusable bottom-sheet transaction-PIN confirmation for every
 * money-movement action (PLAN.md Part 1 decision), backed by the fully
 * typed `POST /v1/transaction-authorizations` (auth-customer). RESOLVED
 * (PLAN.md "Real blockers" MOB-06): transaction-PIN setup/confirm now
 * exist (`/security/transaction-pin/create`). This sheet has no reliable
 * way to distinguish "wrong PIN" from "no PIN set up yet" — both return a
 * generic 401 from `POST /v1/transaction-authorizations`, and the contract
 * doesn't expose a distinct error code for either case — so on a 401 it
 * offers a "Set up transaction PIN" action rather than guessing which one
 * happened.
 */
export function TransactionPinSheet({ visible, onClose, commandType, resourceId, requestPayload, onAuthorized }: TransactionPinSheetProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!visible) {
      setPin("");
      setError(null);
      setNeedsSetup(false);
    }
  }, [visible]);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    computeRequestHash(requestPayload)
      .then((requestHash) => api.authorizeTransaction({ commandType, resourceId, requestHash, pin, idempotencyKey: createIdempotencyKey() }))
      .then((result) => onAuthorized(result.authorization_token))
      .catch((authError) => {
        const isAuthFailure = authError instanceof ApiError && authError.category === "authentication";
        setError(isAuthFailure ? "Incorrect PIN — or you haven't set up a transaction PIN yet." : authError instanceof ApiError ? authError.message : "Something went wrong. Please try again.");
        setNeedsSetup(isAuthFailure);
        setPin("");
      })
      .finally(() => setIsSubmitting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const styles = StyleSheet.create({
    title: {
      ...theme.typography.h4,
      color: theme.colors.textPrimary,
      textAlign: "center",
      marginBottom: theme.semanticSpacing.section,
    },
    error: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      textAlign: "center",
      marginBottom: theme.semanticSpacing.form,
    },
    setupButton: {
      marginTop: theme.semanticSpacing.form,
    },
  });

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Enter your transaction PIN</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PinPad length={PIN_LENGTH} value={pin} onChange={setPin} disabled={isSubmitting} />
      {needsSetup ? (
        <View style={styles.setupButton}>
          <Button
            label="Set up transaction PIN"
            variant="secondary"
            onPress={() => {
              onClose();
              router.push("/security/transaction-pin/create");
            }}
          />
        </View>
      ) : null}
    </BottomSheet>
  );
}
