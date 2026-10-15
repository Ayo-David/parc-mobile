import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import type { BeneficiaryKind } from "@/api/schemas";

export function useTransferBeneficiaries(kind: BeneficiaryKind) {
  return useQuery({
    queryKey: ["beneficiaries", "typed", kind],
    queryFn: () => api.listBeneficiaries(kind),
    retry: false,
  });
}
