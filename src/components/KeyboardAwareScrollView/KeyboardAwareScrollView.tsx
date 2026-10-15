import { useEffect, useRef } from "react";
import { Keyboard, ScrollView, TextInput, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewProps } from "react-native";

import { useTheme } from "@/theme";

/** Lets a parent KeyboardAvoidingView finish resizing before measuring. */
const KEYBOARD_SETTLE_MS = 80;

/**
 * Amount to scroll so a focused input's bottom edge (plus `margin`) clears
 * whichever is higher: the scroll view's own bottom edge or the keyboard's
 * top edge. All values are window coordinates; zero when already visible.
 */
export function overlapToReveal(params: { inputBottom: number; viewportBottom: number; keyboardTop: number; margin: number }): number {
  const visibleBottom = Math.min(params.viewportBottom, params.keyboardTop);
  return Math.max(0, params.inputBottom + params.margin - visibleBottom);
}

/**
 * ScrollView that scrolls the focused TextInput into view when the keyboard
 * opens. A plain ScrollView shrinks under KeyboardAvoidingView but never
 * scrolls on iOS, and on Android (edge-to-edge, where the window no longer
 * resizes) the keyboard simply covers lower fields. Inputs outside this
 * scroll view — e.g. on a screen still mounted underneath in the stack —
 * are ignored because `measureLayout` fails for non-descendants.
 */
export function KeyboardAwareScrollView({ onScroll, scrollEventThrottle, ...props }: ScrollViewProps) {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const margin = theme.spacing.lg;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = Keyboard.addListener("keyboardDidShow", (event) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const scroll = scrollRef.current;
        const viewport = scroll?.getNativeScrollRef();
        const input = TextInput.State.currentlyFocusedInput();
        if (!scroll || !viewport || !input) return;
        // measureLayout only succeeds for inputs inside this scroll view.
        input.measureLayout(
          viewport,
          () => {
            viewport.measureInWindow((_left, viewportTop, _viewportWidth, viewportHeight) => {
              input.measureInWindow((_x, inputTop, _width, inputHeight) => {
                const distance = overlapToReveal({
                  inputBottom: inputTop + inputHeight,
                  viewportBottom: viewportTop + viewportHeight,
                  keyboardTop: event.endCoordinates.screenY,
                  margin,
                });
                if (distance > 0) scroll.scrollTo({ y: scrollY.current + distance, animated: true });
              });
            });
          },
          () => undefined,
        );
      }, KEYBOARD_SETTLE_MS);
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [margin]);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollY.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  }

  return <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" {...props} onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle ?? 16} />;
}
