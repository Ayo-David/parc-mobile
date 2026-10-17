import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Lightweight custom bottom sheet (Modal-based) — no new dependency needed for this. */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    keyboardAvoider: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.scrim,
      justifyContent: "flex-end",
    },
    sheet: {
      // Lets content (e.g. a searchable picker list) shrink above the keyboard instead of running under it or off the top.
      maxHeight: "90%",
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radii.sheet,
      borderTopRightRadius: theme.radii.sheet,
      padding: theme.semanticSpacing.card,
      ...theme.elevation.sheet,
    },
    handle: {
      alignSelf: "center",
      width: theme.spacing.xxxl,
      height: theme.spacing.xs,
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.border,
      marginBottom: theme.semanticSpacing.component,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* A Modal is its own window, so the screen's KeyboardAvoidingView doesn't reach it; "padding" on Android too (edge-to-edge). */}
      <KeyboardAvoidingView style={styles.keyboardAvoider} behavior="padding">
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.handle} />
            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
