import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";

export function useNotifications() {
  return useQuery({ queryKey: ["notifications"], queryFn: () => api.getNotifications() });
}
