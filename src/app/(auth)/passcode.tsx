import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useBootstrap } from "@/api/queries/useBootstrap";
import { PinPad } from "@/components/PinPad/PinPad";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useAuth } from "@/auth/useAuth";
import { useTheme } from "@/theme";

const PASSCODE_LENGTH = 6;

/**
 * Figma "Passcode" (node 226:1555, login variant). On completing all 6
 * digits, fires POST /v1/auth/passcode/login. A successful login updates
 * useSessionStore, which the root layout's Stack.Protected guard reacts to
 * automatically — no manual navigation to (tabs) happens here.
 */
export default function EnterPasscodeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { identifier } = useLocalSearchParams<{ identifier: string }>();
  const bootstrap = useBootstrap();
  const { login, isLoggingIn, loginError } = useAuth();
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    if (passcode.length !== PASSCODE_LENGTH || !bootstrap.data || isLoggingIn) {
      return;
    }
    login({ tenantId: bootstrap.data.tenant_id, identifier, passcode }).catch(() => {
      setPasscode("");
    });
    // login/bootstrap.data intentionally omitted: this effect should only
    // re-fire when the entered passcode itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passcode]);

  const styles = StyleSheet.create({
    content: {
      flex: 1,
      paddingTop: theme.semanticSpacing.section,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
      textAlign: "center",
      marginBottom: theme.semanticSpacing.section,
    },
    error: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      textAlign: "center",
      marginBottom: theme.semanticSpacing.component,
    },
    forgot: {
      ...theme.typography.bodySmall,
      color: theme.colors.primary,
      textAlign: "center",
      marginTop: theme.semanticSpacing.section,
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Enter your 6-digit passcode</Text>
        {loginError ? <Text style={styles.error}>{loginError.message}</Text> : null}
        <PinPad length={PASSCODE_LENGTH} value={passcode} onChange={setPasscode} disabled={isLoggingIn || bootstrap.isLoading} />
        <Pressable onPress={() => router.push({ pathname: "/(auth)/forgot-passcode", params: { identifier } })} disabled={isLoggingIn}>
          <Text style={styles.forgot}>Forgot passcode?</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
