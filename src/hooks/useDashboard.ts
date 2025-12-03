import { useQuery } from "@tanstack/react-query";

const fetchDashboard = async () => {
  const response = await fetch("/api/user/dashboard");
  if (!response.ok) {
    throw new Error("Ошибка загрузки аналитики");
  }
  return response.json();
};

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 10000, // 10 секунд
  });
};





