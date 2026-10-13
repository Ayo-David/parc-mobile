import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { BackButton } from "@/components/BackButton/BackButton";
import { Checkbox } from "@/components/Checkbox/Checkbox";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { StepDots } from "@/components/StepDots/StepDots";
import { TextField } from "@/components/TextField/TextField";
import { useTheme } from "@/theme";

const LOCAL_NUMBER_PATTERN = /^[789][01][0-9]{8}$/;
const SIGNUP_STEP_COUNT = 7;

/**
 * Figma node 322:263 — the canonical Phone Verification screen (with
 * referral code + ToS checkbox + "Login" link), chosen over the older
 * plain variant (226:1652) because it matches the confirmed backend
 * registration contract (phone_number, consent_ids, referral_code).
 * RESOLVED (PLAN.md "Real blockers"): consent_ids now come from the real
 * public `GET /v1/onboarding/reference-data` endpoint, not a dev-only
 * placeholder. RESOLVED (MOB-23): `POST /v1/onboarding/registrations`
 * documents a real `409 Conflict` response — the Axios interceptor
 * already normalizes that to `ApiError.category === "conflict"` — so the
 * real "Onboarding 03 — Duplicate Registration" screen (node 439:357,
 * missing-mobile.md §2.2) can be shown for that specific case instead of
 * the generic inline error every other failure gets.
 *
 * The country-code chip is display-only (not an interactive picker) —
 * the app only supports Nigerian numbers (`LOCAL_NUMBER_PATTERN`), so a
 * picker would be non-functional chrome. The bold "Terms of Service" /
 * "Privacy Policy" spans in the consent label are themselves the link to
 * the real "Misc 01 — Terms & Privacy Viewer" (node 439:439) — Figma's
 * own bold-emphasis treatment doubles as the tap target rather than
 * adding an extra line Figma doesn't show.
 */
export default function RegisterPhoneScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const [localNumber, setLocalNumber] = useState("");
  const [showReferral, setShowReferral] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const isValidNumber = LOCAL_NUMBER_PATTERN.test(localNumber);
  const allConsents = referenceData.data?.consent_documents ?? [];
  const flaggedConsents = allConsents.filter((doc) => doc.required_at_registration === true);
  // Falls back to every listed consent document only if none are explicitly
  // flagged for registration — avoids hard-blocking signup on a tenant that
  // hasn't populated the flag yet, without guessing which ones matter.
  const registrationConsents = flaggedConsents.length > 0 ? flaggedConsents : allConsents;
  // Legal-consent guard: registration must reference at least one real
  // consent document from GET /v1/onboarding/reference-data. A tenant with
  // none configured cannot onboard customers — disclosed below rather than
  // submitting an empty consent_ids list.
  const hasRequiredConsents = registrationConsents.length > 0;
  const consentsUnavailable = referenceData.isSuccess && !hasRequiredConsents;
  const canContinue = isValidNumber && agreedToTerms && hasRequiredConsents && !!bootstrap.data;

  async function handleContinue() {
    if (!canContinue || !bootstrap.data) return;
    setIsSubmitting(true);
    setError(null);
    setIsDuplicate(false);
    try {
      const phoneNumber = `+234${localNumber}`;
      const result = await api.startOnboarding({
        tenantId: bootstrap.data.tenant_id,
        phoneNumber,
        consentIds: registrationConsents.map((doc) => doc.id),
        referralCode: referralCode.trim() || undefined,
        idempotencyKey: createIdempotencyKey(),
      });
      router.push({
        pathname: "/(auth)/register-otp",
        params: { onboardingId: result.onboarding_id, challengeId: result.phone_challenge.challenge_id, phoneNumber },
      });
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.category === "conflict") {
        setIsDuplicate(true);
      } else {
        setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDuplicate) {
    return (
      <StatusScreenLayout
        icon="person-outline"
        tone="error"
        title="This account already exists"
        body="We found an existing Parc account linked to this phone number / NIN. Sign in instead, or contact support if you believe this is an error."
        onBack={() => setIsDuplicate(false)}
        footer={
          <>
            <Text
              style={{ ...theme.typography.button, color: theme.colors.primary, textAlign: "center" }}
              onPress={() => router.replace("/(auth)/sign-in")}
            >
              Sign in instead
            </Text>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted, textAlign: "center" }}>Support is available once you&apos;re signed in, from Help &amp; Support.</Text>
          </>
        }
      />
    );
  }

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: theme.spacing.md,
    },
    body: {
      paddingTop: theme.semanticSpacing.card,
    },
    title: {
      ...theme.typography.text30ExtraBold,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.text15Regular,
      color: theme.colors.textTertiary,
      marginTop: theme.spacing.sm + 2,
    },
    errorText: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      marginTop: theme.spacing.sm,
    },
    fieldGroup: {
      marginTop: theme.semanticSpacing.form + theme.spacing.xs,
      gap: 14,
    },
    fieldLabel: {
      ...theme.typography.text13SemiBold,
      color: theme.colors.textSecondary,
    },
    phoneRow: {
      flexDirection: "row",
      gap: theme.spacing.sm + 2,
      marginTop: theme.spacing.sm,
    },
    countryChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: theme.control.input,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderWidth: theme.borderWidth.thin,
      borderColor: theme.colors.borderSubtle,
      borderRadius: theme.radii.button,
    },
    flagEmoji: {
      fontSize: 17,
    },
    countryCode: {
      ...theme.typography.text14Bold,
      color: theme.colors.textPrimary,
    },
    phoneInput: {
      flex: 1,
    },
    referralToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      alignSelf: "flex-start",
    },
    referralCheckbox: {
      width: 20,
      height: 20,
      borderRadius: theme.radii.sm,
      borderWidth: theme.borderWidth.thin,
      borderColor: theme.colors.secondary,
      backgroundColor: showReferral ? theme.colors.secondarySubtle : "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    referralLabel: {
      ...theme.typography.text14Bold,
      color: theme.colors.secondary,
    },
    referralField: {
      marginTop: theme.spacing.sm + 2,
    },
    referralInput: {
      height: theme.control.input,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.secondarySubtle,
      borderWidth: theme.borderWidth.thin,
      borderColor: theme.colors.secondary,
      borderRadius: theme.radii.button,
      textAlignVertical: "center",
    },
    referralInputText: {
      ...theme.typography.text15RegularFigure,
      color: theme.colors.textPrimary,
    },
    referralHelper: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.xs + 2,
    },
    consentRow: {
      marginTop: theme.spacing.md,
    },
    consentLabel: {
      ...theme.typography.text13Regular,
      color: theme.colors.textTertiary,
    },
    consentBold: {
      ...theme.typography.text13Bold,
      color: theme.colors.textPrimary,
    },
    legalLinkRow: {
      marginTop: theme.spacing.xs,
      marginLeft: 22 + theme.spacing.sm,
    },
    legalLink: {
      ...theme.typography.caption,
      color: theme.colors.secondary,
    },
    footer: {
      marginTop: theme.spacing.xxl,
      paddingBottom: theme.semanticSpacing.section,
      gap: theme.spacing.md,
    },
    authButton: {
      height: theme.control.authButton,
      borderRadius: theme.radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: canContinue ? theme.colors.primary : theme.colors.border,
    },
    authButtonLabel: {
      ...theme.typography.text16Bold,
      color: theme.colors.textInverse,
    },
    loginRow: {
      alignItems: "center",
    },
    loginText: {
      ...theme.typography.text14Regular,
      color: theme.colors.textMuted,
    },
    loginLink: {
      ...theme.typography.text14Bold,
      color: theme.colors.secondary,
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <BackButton />
        <StepDots total={SIGNUP_STEP_COUNT} current={0} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>What&apos;s your{"\n"}phone number?</Text>
        <Text style={styles.subtitle}>We&apos;ll send a 6-digit code to verify your number</Text>
        {consentsUnavailable ? <Text style={styles.errorText}>Sign-up isn&apos;t available right now. Please try again later or contact support.</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.fieldGroup}>
          <View>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryChip}>
                <Text style={styles.flagEmoji}>🇳🇬</Text>
                <Text style={styles.countryCode}>+234</Text>
              </View>
              <View style={styles.phoneInput}>
                <TextField value={localNumber} onChangeText={setLocalNumber} placeholder="8012345678" keyboardType="number-pad" maxLength={10} autoFocus />
              </View>
            </View>
          </View>

          <View>
            <Pressable style={styles.referralToggle} onPress={() => setShowReferral((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: showReferral }}>
              <View style={styles.referralCheckbox}>{showReferral ? <Ionicons name="checkmark" size={12} color={theme.colors.secondary} /> : null}</View>
              <Text style={styles.referralLabel}>Have a referral code?</Text>
            </Pressable>
            {showReferral && (
              <View style={styles.referralField}>
                <TextInput
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="e.g. PARC-ABCD123"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[styles.referralInput, styles.referralInputText]}
                />
                <Text style={styles.referralHelper}>Referral codes give you and your friend bonuses</Text>
              </View>
            )}
          </View>

          <View style={styles.consentRow}>
            <Checkbox
              checked={agreedToTerms}
              onToggle={() => setAgreedToTerms((prev) => !prev)}
              label={
                <Text style={styles.consentLabel}>
                  I have read, understood and agreed to the <Text style={styles.consentBold}>Terms of Service</Text> and <Text style={styles.consentBold}>Privacy Policy</Text>
                </Text>
              }
            />
            <Pressable style={styles.legalLinkRow} onPress={() => router.push("/(auth)/legal")} accessibilityRole="link">
              <Text style={styles.legalLink}>Read the Terms of Service and Privacy Policy</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.authButton} disabled={!canContinue || isSubmitting} onPress={handleContinue} accessibilityRole="button">
            <Text style={styles.authButtonLabel}>{isSubmitting ? "Sending…" : "Send Verification Code →"}</Text>
          </Pressable>
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              Already have a Parc account? <Text style={styles.loginLink} onPress={() => router.push("/(auth)/sign-in")}>Login</Text>
            </Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
