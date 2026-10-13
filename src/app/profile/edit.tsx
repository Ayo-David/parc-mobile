import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useProfile } from "@/api/queries/useProfile";
import { queryClient } from "@/api/queryClient";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TextField } from "@/components/TextField/TextField";
import { useTheme } from "@/theme";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initialsOf(first?: string | null, last?: string | null): string {
  return [first, last]
    .filter((part): part is string => !!part)
    .map((part) => part[0]!.toUpperCase())
    .join("") || "?";
}

/**
 * Figma "Edit Profile" (233:7902), backed by PATCH /v1/profile
 * (first_name/last_name/email). Only changed fields are sent. The profile
 * API exposes the email only masked, so the email field starts empty with
 * the current masked address as a hint, and is sent only when filled.
 * Figma's "Change Photo" is omitted — no profile-photo API exists. Phone is
 * read-only (Figma's own copy: contact support to change it).
 */
export default function EditProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const [firstName, setFirstName] = useState(profile.data?.first_name ?? "");
  const [lastName, setLastName] = useState(profile.data?.last_name ?? "");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const firstChanged = trimmedFirst.length > 0 && trimmedFirst !== (profile.data?.first_name ?? "");
  const lastChanged = trimmedLast.length > 0 && trimmedLast !== (profile.data?.last_name ?? "");
  const emailEntered = trimmedEmail.length > 0;
  const emailValid = !emailEntered || EMAIL_PATTERN.test(trimmedEmail);
  const namesValid = trimmedFirst.length > 0 && trimmedLast.length > 0;
  const canSave = !!profile.data && namesValid && emailValid && (firstChanged || lastChanged || emailEntered) && !isSaving;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await api.updateProfile({
        firstName: firstChanged ? trimmedFirst : undefined,
        lastName: lastChanged ? trimmedLast : undefined,
        email: emailEntered ? trimmedEmail : undefined,
        idempotencyKey: createIdempotencyKey(),
      });
      queryClient.setQueryData(["profile"], updated);
      router.back();
    } catch (saveError) {
      setError(
        saveError instanceof ApiError && saveError.code === "EMAIL_ALREADY_EXISTS"
          ? "That email address is already used by another account."
          : saveError instanceof ApiError && saveError.category === "network"
            ? "We couldn't reach Parc. Check your connection and try again."
            : "We couldn't save your changes. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingBottom: theme.spacing.lg },
    avatarWrap: { alignItems: "center", paddingVertical: theme.spacing.sm },
    avatar: {
      width: theme.control.iconButtonXl + theme.spacing.sm,
      height: theme.control.iconButtonXl + theme.spacing.sm,
      borderRadius: theme.radii.card + theme.spacing.xs,
      backgroundColor: theme.colors.surfaceInverse,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { ...theme.typography.text22ExtraBold, color: theme.colors.textInverse },
    fields: { gap: theme.spacing.md + 2, paddingTop: theme.spacing.xxl },
    label: { ...theme.typography.text12SemiBold, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm - 2 },
    hint: { ...theme.typography.text11Regular, color: theme.colors.textDisabled, marginTop: theme.spacing.xs },
    hintError: { color: theme.colors.error },
    phoneCard: { backgroundColor: theme.colors.primarySubtle, borderRadius: theme.radii.input, paddingHorizontal: theme.spacing.md + 2, paddingVertical: theme.spacing.md },
    phoneLabel: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    phoneValue: { ...theme.typography.text15BoldFigure, color: theme.colors.textSecondary, marginTop: theme.spacing.xs / 2 },
    error: { ...theme.typography.text12Regular, color: theme.colors.error, marginTop: theme.spacing.md },
    footer: { paddingVertical: theme.spacing.md },
    saveButton: {
      height: theme.control.buttonMedium,
      borderRadius: theme.radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: canSave ? theme.colors.primary : theme.colors.disabledSurface,
    },
    saveLabel: { ...theme.typography.text15Bold, color: canSave ? theme.colors.textInverse : theme.colors.textDisabled },
  });

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <BackHeader title="Edit Profile" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialsOf(trimmedFirst || profile.data?.first_name, trimmedLast || profile.data?.last_name)}</Text>
            </View>
          </View>

          <View style={styles.fields}>
            <View>
              <Text style={styles.label}>First Name</Text>
              <TextField value={firstName} onChangeText={setFirstName} autoCapitalize="words" autoComplete="given-name" state={trimmedFirst ? "default" : "error"} />
            </View>
            <View>
              <Text style={styles.label}>Last Name</Text>
              <TextField value={lastName} onChangeText={setLastName} autoCapitalize="words" autoComplete="family-name" state={trimmedLast ? "default" : "error"} />
            </View>
            <View>
              <Text style={styles.label}>Email Address</Text>
              <TextField
                value={email}
                onChangeText={setEmail}
                placeholder="Enter a new email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                state={emailValid ? "default" : "error"}
              />
              <Text style={[styles.hint, !emailValid && styles.hintError]}>
                {!emailValid ? "Enter a valid email address" : profile.data?.masked_email ? `Current: ${profile.data.masked_email}` : "Leave blank to keep your current email"}
              </Text>
            </View>
            {profile.data?.masked_phone_number ? (
              <View style={styles.phoneCard}>
                <Text style={styles.phoneLabel}>Phone Number</Text>
                <Text style={styles.phoneValue}>{profile.data.masked_phone_number}</Text>
                <Text style={styles.hint}>Contact support to update phone number</Text>
              </View>
            ) : null}
          </View>
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          <Pressable style={styles.saveButton} onPress={handleSave} disabled={!canSave} accessibilityRole="button" accessibilityState={{ disabled: !canSave, busy: isSaving }}>
            <Text style={styles.saveLabel}>{isSaving ? "Saving…" : "Save Changes"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
