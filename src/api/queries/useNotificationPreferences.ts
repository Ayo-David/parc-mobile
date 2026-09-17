import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSessionStore } from "@/state/stores/sessionStore";

export function useNotificationPreferences() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: api.getNotificationPreferences,
    enabled: isAuthenticated,
  });
}
