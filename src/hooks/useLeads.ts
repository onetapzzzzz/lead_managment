import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "@/lib/api";
import { z } from "zod";

const LEADS_MY_QUERY_KEY = ["leads", "my"];
const LEADS_MARKET_QUERY_KEY = ["leads", "market"];

export { useLead } from "./useLead";

export const useMyLeads = (params?: Partial<z.infer<typeof import("@/lib/validations").leadsQuerySchema>> & { type?: "uploaded" | "received" | "purchased" }) => {
  return useQuery({
    queryKey: [...LEADS_MY_QUERY_KEY, params],
    queryFn: () => leadsApi.my(params),
    staleTime: 10000, // 10 секунд
  });
};

export const useMarketLeads = (params?: z.infer<typeof import("@/lib/validations").leadsQuerySchema> & { niche?: string; region?: string }) => {
  return useQuery({
    queryKey: [...LEADS_MARKET_QUERY_KEY, params],
    queryFn: () => leadsApi.market(params),
    staleTime: 10000, // 10 секунд
  });
};

export const useUploadLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: z.infer<typeof import("@/lib/validations").leadUploadSchema>) =>
      leadsApi.upload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_MY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LEADS_MARKET_QUERY_KEY });
    },
  });
};

export const useBuyLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: z.infer<typeof import("@/lib/validations").leadBuySchema>) =>
      leadsApi.buy(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LEADS_MY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LEADS_MARKET_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["lead", variables.leadId] });
    },
  });
};

