import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme, withAlpha } from "@/theme";

type TabBarRenderProp = NonNullable<ComponentProps<typeof Tabs>["tabBar"]>;
export type GlassTabBarProps = Parameters<TabBarRenderProp>[0];

/**
 * Floating "glass pill" bottom tab bar (approved requirement: cross-platform
 * glassmorphism via expo-blur, not expo-glass-effect, which is iOS-only).
 * Replaces expo-router's default tab bar via <Tabs tabBar={...}>. Every
 * color/spacing/radius value comes from the theme per .clauderules.
 *
 * Per-tab label/icon are read from each screen's own `options` (standard
 * React Navigation `tabBarIcon`/`tabBarLabel`/`title`) rather than hardcoded
 * here, so this component stays generic and reusable.
 */
export function GlassTabBar({ state, descriptors, navigation, insets }: GlassTabBarProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    shadowWrapper: {
      position: "absolute",
      left: theme.semanticSpacing.screenX,
      right: theme.semanticSpacing.screenX,
      bottom: insets.bottom + theme.spacing.sm,
      borderRadius: theme.radii.full,
      // iOS only casts a shadow from a view with visible content of its own;
      // this opaque token background is fully covered by the blur/tint/row
      // below and exists solely so the shadow renders correctly.
      backgroundColor: theme.colors.surface,
      ...theme.elevation.md,
    },
    pill: {
      borderRadius: theme.radii.full,
      overflow: "hidden",
    },
    tint: {
      ...StyleSheet.absoluteFill,
      backgroundColor: withAlpha(theme.mode === "dark" ? theme.colors.textPrimary : theme.colors.surface, 0.55),
    },
    row: {
      flexDirection: "row",
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
    },
    item: {
      flex: 1,
      minHeight: theme.control.minTouchTarget,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
    },
    label: {
      ...theme.typography.caption,
    },
  });

  return (
    <View style={styles.shadowWrapper}>
      <View style={styles.pill}>
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={80}
          tint={theme.mode === "dark" ? "dark" : "light"}
          experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
        />
        <View style={styles.tint} />
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = typeof options.tabBarLabel === "string" ? options.tabBarLabel : (options.title ?? route.name);
            const isFocused = state.index === index;
            const color = isFocused ? theme.colors.primary : theme.colors.textMuted;

            function handlePress() {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                onPress={handlePress}
                style={styles.item}
              >
                {options.tabBarIcon?.({ focused: isFocused, color, size: theme.icon.default })}
                <Text style={[styles.label, { color }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
