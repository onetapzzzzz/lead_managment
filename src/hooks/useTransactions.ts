import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api";
import { z } from "zod";

export const useTransactions = (params?: z.infer<typeof import("@/lib/validations").leadsQuerySchema>) => {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => transactionsApi.list(params),
    staleTime: 10000, // 10 секунд
  });
};





