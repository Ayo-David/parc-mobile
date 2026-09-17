import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { useSessionStore } from "@/state/stores/sessionStore";

export function useFaqs() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: ["support-faqs"],
    queryFn: api.getFaqs,
    enabled: isAuthenticated,
    staleTime: 30 * 60_000,
  });
}

export function useSupportTickets() {
  const isAuthenticated = useSessionStore((state) => state.session !== null);
  return useQuery({
    queryKey: ["support-tickets"],
    queryFn: api.getSupportTickets,
    enabled: isAuthenticated,
  });
}
