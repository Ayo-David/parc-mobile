import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";

export function useBootstrap() {
  return useQuery({
    queryKey: ["bootstrap"],
    queryFn: api.getBootstrap,
    staleTime: 5 * 60_000,
  });
}
