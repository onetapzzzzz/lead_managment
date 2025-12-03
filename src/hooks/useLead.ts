import { useQuery } from "@tanstack/react-query";
import { leadsApi } from "@/lib/api";

export const useLead = (leadId: string) => {
  return useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => leadsApi.getById(leadId),
    enabled: !!leadId,
    staleTime: 10000,
  });
};




