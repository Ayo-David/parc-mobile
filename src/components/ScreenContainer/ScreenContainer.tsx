import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

export interface ScreenContainerProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * "auth" is the light onboarding/auth chrome from Figma (SignIn 226:1452,
   * PhoneEmailLogin 226:1514, Passcode 226:1555): white surface, 24px
   * gutter, and a dark status bar — which must be set explicitly, since the
   * dark GetStarted screen beneath it in the stack sets a light one.
   */
  variant?: "default" | "auth";
}

/**
 * No longer reserves clearance for a floating tab bar — tab screens now
 * render under Expo Router's Native Tabs, a real edge-attached native tab
 * bar (not a floating pill), which already manages its own safe-area
 * content insets automatically.
 */
export function ScreenContainer({ children, style, variant = "default" }: ScreenContainerProps) {
  const { theme } = useTheme();
  const isAuth = variant === "auth";
  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor: isAuth ? theme.colors.surface : theme.colors.background,
          paddingHorizontal: isAuth ? theme.spacing.xxl : theme.semanticSpacing.screenX,
        },
        style,
      ]}
    >
      {isAuth ? <StatusBar style="dark" /> : null}
      {children}
    </SafeAreaView>
  );
}
