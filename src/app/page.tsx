"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useUser } from "@/hooks/useUser";
import { useTelegramUser } from "@/hooks/useTelegramUser";
import { useMyLeads } from "@/hooks/useLeads";
import { formatPrice } from "@/lib/leadPricing";
import { useQuery } from "@tanstack/react-query";
import { leadsApi } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const { userId: tgUserId, username: tgUsername, fullName: tgFullName } = useTelegramUser();
  const { data: user, isLoading: userLoading } = useUser({ 
    userId: tgUserId || undefined,
    username: tgUsername || undefined,
    fullName: tgFullName || undefined
  });
  
  const { data: uploadedData } = useMyLeads({ type: "uploaded" });
  const { data: purchasedData } = useMyLeads({ type: "purchased" });
  
  const { data: marketData } = useQuery({
    queryKey: ["leads", "market", tgUserId],
    queryFn: () => leadsApi.market({ page: 1, limit: 10, userId: tgUserId || undefined }),
    staleTime: 10000,
    enabled: !!tgUserId,
  });

  const totalUploaded = uploadedData?.stats?.totalUploaded || 0;
  const totalReward = uploadedData?.stats?.totalReward || 0;
  const totalPurchased = purchasedData?.stats?.totalPurchased || 0;
  const marketCount = marketData?.total || 0;

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-24"
    >
      <Header title="Board Traff" onProfileClick={() => router.push("/profile")} />
      
      <main className="container-mobile pt-6 pb-6 space-y-6">
        {/* Баланс */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
        >
          <Card className="p-6 bg-gradient-to-br from-light-accent/10 via-transparent to-light-accent/5 dark:from-dark-accent/20 dark:to-dark-accent/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-light-textSecondary dark:text-dark-textSecondary mb-1">
                  Ваш баланс
                </div>
                <div className="text-3xl font-bold text-light-accent dark:text-dark-accent">
                  {userLoading ? "..." : formatPrice(user?.balance || 0)} LC
                </div>
                <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
                  ≈ {Math.round((user?.balance || 0) * 100)} ₽
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-light-accent/20 dark:bg-dark-accent/30 flex items-center justify-center">
                <span className="text-3xl">💎</span>
              </div>
            </div>
            
            <div className="p-3 rounded-xl bg-light-surface/50 dark:bg-dark-surface/50">
              <div className="text-sm text-light-textSecondary dark:text-dark-textSecondary">
                💡 Lead Coin нельзя купить — только заработать, загружая лиды!
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Быстрые действия */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <Button
            onClick={() => router.push("/upload")}
            className="h-20 flex flex-col items-center justify-center gap-2"
          >
            <span className="text-2xl">📤</span>
            <span className="text-sm">Загрузить лиды</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/market")}
            className="h-20 flex flex-col items-center justify-center gap-2"
          >
            <span className="text-2xl">🛒</span>
            <span className="text-sm">Маркетплейс</span>
          </Button>
        </motion.div>

        {/* Статистика */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-light-text dark:text-dark-text mb-3">
            Ваша статистика
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary mb-1">
                Загружено лидов
              </div>
              <div className="text-2xl font-bold text-light-text dark:text-dark-text">
                {totalUploaded}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary mb-1">
                Заработано
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                +{formatPrice(totalReward)} LC
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary mb-1">
                Куплено лидов
              </div>
              <div className="text-2xl font-bold text-light-text dark:text-dark-text">
                {totalPurchased}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary mb-1">
                На маркете
              </div>
              <div className="text-2xl font-bold text-light-accent dark:text-dark-accent">
                {marketCount}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Как это работает */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-light-text dark:text-dark-text mb-3">
            Как это работает
          </h2>
          <Card className="p-4 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">1</span>
              </div>
              <div>
                <div className="font-medium text-light-text dark:text-dark-text text-sm">
                  Загружай лиды
                </div>
                <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
                  Вставь текст с телефонами — мы их автоматически распарсим
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">2</span>
              </div>
              <div>
                <div className="font-medium text-light-text dark:text-dark-text text-sm">
                  Получай LC при продаже
                </div>
                <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
                  До <b>3.5 LC</b> за лид (2 + 1 + 0.5 за 3 продажи)
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">3</span>
              </div>
              <div>
                <div className="font-medium text-light-text dark:text-dark-text text-sm">
                  Покупай чужие лиды
                </div>
                <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
                  Уникальный (0 из 3) — 2 LC, затем 1 LC и 0.5 LC
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Лиды на маркете (превью) */}
        {marketData && marketData.leads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
                Новые лиды
              </h2>
              <button
                onClick={() => router.push("/market")}
                className="text-sm text-light-accent dark:text-dark-accent font-medium"
              >
                Все →
              </button>
            </div>
            <div className="space-y-2">
              {marketData.leads.slice(0, 3).map((lead) => (
                <Card
                  key={lead.id}
                  className="p-3 cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => router.push("/market")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm text-light-text dark:text-dark-text">
                        {lead.phone}
                      </div>
                      <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
                        {lead.isUnique ? "✨ 0 из 3 (уникальный)" : lead.purchaseStatus}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-light-accent dark:text-dark-accent">
                        {formatPrice(lead.price)} LC
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}
