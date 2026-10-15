import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { BackHandler } from "react-native";

/**
 * For result screens (transfer/bill/loan/savings outcomes, PIN set): going
 * "back" must never re-open the review/PIN step of a completed action. The
 * screen also renders `<Stack.Screen options={{ gestureEnabled: false }} />`
 * to stop the iOS swipe; this hook routes Android's hardware back to the
 * screen's own exit action (usually "Done").
 */
export function useTerminalScreen(onExit: (() => void) | undefined) {
  const exitRef = useRef(onExit);
  useEffect(() => {
    exitRef.current = onExit;
  }, [onExit]);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        exitRef.current?.();
        return true;
      });
      return () => subscription.remove();
    }, []),
  );
}
