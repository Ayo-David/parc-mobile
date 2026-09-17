import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { GlassTabBar } from "@/components/GlassTabBar/GlassTabBar";

/**
 * Ionicons are a documented placeholder until the real Figma icon set
 * (Iconography section, node 20:824-20:1168) is exported as assets — see
 * docs/theme/README.md.
 */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "home" : "home-outline"} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "card" : "card-outline"} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: "Loans",
          tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "cash" : "cash-outline"} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: "Savings",
          tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "wallet" : "wallet-outline"} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Me",
          tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "person" : "person-outline"} color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
