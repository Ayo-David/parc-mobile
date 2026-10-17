import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet/BottomSheet";
import { TextField } from "@/components/TextField/TextField";
import { useTheme } from "@/theme";

export interface PickerOption {
  value: string;
  label: string;
}

export interface PickerFieldProps {
  placeholder: string;
  options: PickerOption[];
  selectedValue: string | null;
  onSelect: (option: PickerOption) => void;
  searchable?: boolean;
  disabled?: boolean;
}

/** Reusable bottom-sheet picker for reference-data lists (states, LGAs, occupations, income bands). */
export function PickerField({ placeholder, options, selectedValue, onSelect, searchable = false, disabled = false }: PickerFieldProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel = options.find((option) => option.value === selectedValue)?.label ?? null;
  const filteredOptions = useMemo(() => {
    if (!searchable || query.trim().length === 0) return options;
    const lowered = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(lowered));
  }, [options, query, searchable]);

  const recipe = theme.components.input[disabled ? "disabled" : "default"];

  const styles = StyleSheet.create({
    trigger: {
      height: theme.control.input,
      borderRadius: theme.radii.input,
      borderWidth: theme.borderWidth.thin,
      borderColor: recipe.borderColor,
      backgroundColor: recipe.backgroundColor,
      paddingHorizontal: theme.semanticSpacing.form,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      opacity: recipe.opacity,
    },
    triggerLabel: {
      ...theme.typography.bodyMedium,
      // Figma dropdown placeholders (#BEBEBE, 226:1974) are lighter than text-input placeholders.
      color: selectedLabel ? recipe.textColor : theme.colors.textDisabled,
    },
    sheetContent: {
      maxHeight: theme.spacing.xxxl * 10,
      flexShrink: 1,
      gap: theme.semanticSpacing.component,
    },
    list: {
      flexShrink: 1,
    },
    optionRow: {
      paddingVertical: theme.semanticSpacing.component,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    optionLabel: { ...theme.typography.bodyMedium, color: theme.colors.textPrimary },
    empty: { ...theme.typography.bodySmall, color: theme.colors.textMuted, textAlign: "center", paddingVertical: theme.semanticSpacing.section },
  });

  return (
    <>
      <Pressable style={styles.trigger} disabled={disabled} onPress={() => setIsOpen(true)}>
        <Text style={styles.triggerLabel}>{selectedLabel ?? placeholder}</Text>
        <Ionicons name="chevron-down" size={theme.icon.inline} color={theme.colors.textMuted} />
      </Pressable>
      <BottomSheet
        visible={isOpen}
        onClose={() => {
          setIsOpen(false);
          setQuery("");
        }}
      >
        <View style={styles.sheetContent}>
          {searchable ? <TextField value={query} onChangeText={setQuery} placeholder="Search" autoFocus /> : null}
          <FlatList
            style={styles.list}
            // One tap selects an option even while the search keyboard is open.
            keyboardShouldPersistTaps="handled"
            data={filteredOptions}
            keyExtractor={(item) => item.value}
            ListEmptyComponent={<Text style={styles.empty}>No results.</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={styles.optionRow}
                onPress={() => {
                  onSelect(item);
                  setIsOpen(false);
                  setQuery("");
                }}
              >
                <Text style={styles.optionLabel}>{item.label}</Text>
                {item.value === selectedValue ? <Ionicons name="checkmark" size={theme.icon.compact} color={theme.colors.primary} /> : null}
              </Pressable>
            )}
          />
        </View>
      </BottomSheet>
    </>
  );
}
