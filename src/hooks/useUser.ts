import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { z } from "zod";

const USER_QUERY_KEY = ["user"];

interface UserParams {
  userId?: string;
  username?: string;
  fullName?: string;
}

export const useUser = (params?: UserParams) => {
  return useQuery({
    queryKey: [...USER_QUERY_KEY, params?.userId],
    queryFn: () => userApi.get(params),
    staleTime: 30000, // 30 секунд
    enabled: !!params?.userId, // Запрос только если есть userId (telegramId)
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
