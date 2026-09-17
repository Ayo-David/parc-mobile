import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TextField } from "@/components/TextField/TextField";
import { useTheme } from "@/theme";

/**
 * Figma "PhoneEmailLogin" (node 226:1514). Collects the identifier only;
 * the actual POST /v1/auth/passcode/login call happens once the passcode
 * screen has both fields (auth-customer's PasscodeLoginRequest takes
 * identifier + passcode + device_id together — see PLAN.md/useAuth.ts).
 */
export default function LoginIdentifierScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");

  const styles = StyleSheet.create({
    content: {
      flex: 1,
      paddingTop: theme.semanticSpacing.section,
      gap: theme.semanticSpacing.component,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      marginBottom: theme.semanticSpacing.component,
    },
  });

  const canContinue = identifier.trim().length >= 3;

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View>
          <Text style={styles.title}>Enter your phone or email</Text>
          <Text style={styles.subtitle}>We'll use this to find your Parc account.</Text>
        </View>
        <TextField
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="Phone number or email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoFocus
        />
        <Button label="Continue" disabled={!canContinue} onPress={() => router.push({ pathname: "/(auth)/passcode", params: { identifier: identifier.trim() } })} />
      </View>
    </ScreenContainer>
  );
}
