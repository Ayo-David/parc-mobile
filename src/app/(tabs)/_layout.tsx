import { Ionicons } from "@expo/vector-icons";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useTheme } from "@/theme";

const VectorIcon = NativeTabs.Trigger.VectorIcon;

/**
 * Figma "AppBottomNav" (HomeScreen 226:3156) is a flat opaque white bar —
 * superseded here per explicit request to use Expo Router's Native Tabs
 * for a real native (iOS Liquid Glass) translucent/blurred tab bar
 * instead of matching that flat bar or the previous custom `GlassTabBar`
 * (an `expo-blur` approximation). This is a real native
 * `UITabBarController`, not a JS approximation. Icons must go through
 * `NativeTabs.Trigger.VectorIcon` (a marker component the native side
 * rasterizes) — passing a rendered `<Ionicons>` element directly to
 * `Icon`'s `src` renders nothing. A single icon per tab (no separate
 * filled/outline selected variant — react-native-screens' `selectedIcon`
 * pairing threw a render error with this "unstable" API) tinted by
 * `iconColor`/`tintColor` for the active state.
 *
 * CORRECTION (2026-09-21, re-checked against `get_design_context` on
 * `226:3156` directly rather than trusting the claim below): Figma's
 * `AppBottomNav` does NOT differentiate the active tab by a magenta
 * icon/label tint — icons are all the same neutral line-art regardless
 * of state, "Home" is bold black text (inactive labels are `#b8b8b8`
 * medium), and the real active-state marker is a separate 4px magenta
 * dot rendered below the label. A dot overlay isn't exposed by this
 * "unstable" Native Tabs API (no per-trigger custom-decoration slot), so
 * the dot itself is a deliberate, accepted platform-constraint gap.
 * Active tint corrected 2026-09-21 (explicit request) from magenta to
 * black (`theme.colors.primary`), matching Figma's actual bold-black
 * active label — closer than the magenta guess, though Figma's icons
 * technically stay neutral-colored even when active (icon tint has no
 * native-tabs equivalent of "bold weight only", so tinting is kept as
 * the closest available signal). Labels below ("Payment"/"Loan",
 * singular) were corrected to Figma's actual copy. Ionicons remain the
 * documented placeholder iconset (design-system.md §9) until real Figma
 * icon assets are exported.
 */
export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <NativeTabs blurEffect="systemChromeMaterial" tintColor={theme.colors.primary} iconColor={{ default: theme.colors.textMuted, selected: theme.colors.primary }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon src={<VectorIcon family={Ionicons} name="home" />} />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="payments">
        <NativeTabs.Trigger.Icon src={<VectorIcon family={Ionicons} name="card" />} />
        <NativeTabs.Trigger.Label>Payment</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="loans">
        <NativeTabs.Trigger.Icon src={<VectorIcon family={Ionicons} name="cash" />} />
        <NativeTabs.Trigger.Label>Loan</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="savings">
        <NativeTabs.Trigger.Icon src={<VectorIcon family={Ionicons} name="wallet" />} />
        <NativeTabs.Trigger.Label>Savings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="me">
        <NativeTabs.Trigger.Icon src={<VectorIcon family={Ionicons} name="person" />} />
        <NativeTabs.Trigger.Label>Me</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
