import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "@/lib/api";
import { z } from "zod";

export const useUploadBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: z.infer<typeof import("@/lib/validations").leadBatchUploadSchema>) =>
      leadsApi.uploadBatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", "my"] });
      queryClient.invalidateQueries({ queryKey: ["leads", "market"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};





