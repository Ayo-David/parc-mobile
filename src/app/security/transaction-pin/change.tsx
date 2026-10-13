import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { PinPad } from "@/components/PinPad/PinPad";
import { useTheme } from "@/theme";

const PIN_LENGTH = 4;

type Step = "current" | "new" | "confirm";

const COPY: Record<Step, { title: string; subtitle: string }> = {
  current: { title: "Enter current PIN", subtitle: "Confirm it's you with your current 4-digit transaction PIN." },
  new: { title: "Choose a new PIN", subtitle: "Pick a 4-digit PIN you haven't used recently." },
  confirm: { title: "Confirm new PIN", subtitle: "Enter your new PIN again." },
};

/**
 * Figma Security & Privacy → "Change Transaction PIN" (233:8702), backed by
 * POST /v1/security/transaction-pin/rotate ({ current_pin, new_pin }).
 * auth-customer answers 401 AUTHENTICATION_FAILED for a wrong current PIN
 * (or when no PIN exists yet) and 422 PIN_REUSE for any of the last five
 * PINs. Digits never leave component state except in the rotate request.
 */
export default function ChangeTransactionPinScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<Step>("current");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rotate(current: string, next: string) {
    setIsSubmitting(true);
    try {
      await api.rotateTransactionPin({ currentPin: current, newPin: next });
      router.replace({ pathname: "/security/transaction-pin/success", params: { mode: "changed" } });
    } catch (rotateError) {
      setCurrentPin("");
      setNewPin("");
      if (rotateError instanceof ApiError && rotateError.code === "PIN_REUSE") {
        setStep("new");
        setCurrentPin(current);
        setError("You've used that PIN recently. Choose a different one.");
      } else if (rotateError instanceof ApiError && rotateError.category === "authentication") {
        setStep("current");
        setError("That current PIN isn't right. If you haven't set a PIN yet, create one instead.");
      } else if (rotateError instanceof ApiError && rotateError.category === "rate_limit") {
        setStep("current");
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setStep("current");
        setError("We couldn't change your PIN right now. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(next: string) {
    setValue(next);
    if (next.length < PIN_LENGTH) return;
    setError(null);
    setValue("");
    if (step === "current") {
      setCurrentPin(next);
      setStep("new");
    } else if (step === "new") {
      if (next === currentPin) {
        setError("Your new PIN must be different from your current PIN.");
        return;
      }
      setNewPin(next);
      setStep("confirm");
    } else if (next !== newPin) {
      setNewPin("");
      setStep("new");
      setError("Those PINs didn't match. Choose your new PIN again.");
    } else {
      void rotate(currentPin, next);
    }
  }

  const styles = StyleSheet.create({
    error: { ...theme.typography.text13Regular, color: theme.colors.error, textAlign: "center", marginBottom: theme.spacing.md },
    link: { ...theme.typography.text13Bold, color: theme.colors.secondary, textAlign: "center", marginTop: theme.spacing.lg },
  });

  return (
    <FormScreenLayout headerTitle="Change Transaction PIN" title={COPY[step].title} subtitle={COPY[step].subtitle}>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {isSubmitting ? <ActivityIndicator color={theme.colors.primary} /> : <PinPad length={PIN_LENGTH} value={value} onChange={handleChange} disabled={isSubmitting} />}
      {step === "current" ? (
        <Text style={styles.link} onPress={() => router.replace("/security/transaction-pin/create")} accessibilityRole="link">
          Haven&apos;t set a PIN yet? Create one
        </Text>
      ) : null}
    </FormScreenLayout>
  );
}
