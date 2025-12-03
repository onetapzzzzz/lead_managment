import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { z } from "zod";

const USER_QUERY_KEY = ["user"];

export const useUser = (userId?: string) => {
  return useQuery({
    queryKey: [...USER_QUERY_KEY, userId],
    queryFn: () => userApi.get(userId),
    staleTime: 30000, // 30 секунд
  });
};

export const useUpdateBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: z.infer<typeof import("@/lib/validations").balanceUpdateSchema>) =>
      userApi.updateBalance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
};





