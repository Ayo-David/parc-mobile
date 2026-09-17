import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

export interface ScreenContainerProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Adds bottom clearance so content isn't hidden behind GlassTabBar's floating pill. */
  hasFloatingTabBar?: boolean;
}

export function ScreenContainer({ children, style, hasFloatingTabBar = false }: ScreenContainerProps) {
  const { theme } = useTheme();
  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingHorizontal: theme.semanticSpacing.screenX,
          paddingBottom: hasFloatingTabBar ? theme.control.iconButtonLarge + theme.spacing.xxl : 0,
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
