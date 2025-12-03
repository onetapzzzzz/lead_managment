"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition, staggerContainer } from "@/lib/motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useMarketLeads, useBuyLead } from "@/hooks/useLeads";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/contexts/ToastContext";
import { formatPrice } from "@/lib/leadPricing";

export default function MarketPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: userData, refetch: refetchUser } = useUser();
  const { data: marketData, isLoading, refetch: refetchMarket } = useMarketLeads();
  const buyLead = useBuyLead();

  const [buyingLeadId, setBuyingLeadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unique">("all");

  const leads = marketData?.leads || [];
  const filteredLeads = filter === "unique" 
    ? leads.filter(l => l.isUnique) 
    : leads;

  const handleBuyLead = async (leadId: string, price: number) => {
    if ((userData?.balance || 0) < price) {
      showToast("Недостаточно поинтов", "error");
      return;
    }

    setBuyingLeadId(leadId);
    try {
      const result = await buyLead.mutateAsync({ leadId });
      showToast(`Лид куплен за ${result.price} поинтов!`, "success");
      refetchUser();
      refetchMarket();
    } catch (error: any) {
      showToast(error.message || "Ошибка покупки", "error");
    } finally {
      setBuyingLeadId(null);
    }
  };

  const getPurchaseBadgeStyles = (purchaseCount: number, isUnique: boolean) => {
    if (isUnique) {
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    }
    if (purchaseCount === 1) {
      return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    }
    return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
  };

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-20 pb-safe-bottom"
    >
      <Header title="Маркетплейс" onProfileClick={() => router.push("/profile")} />
      
      <main className="container-mobile pt-6 pb-6">
        {/* Баланс и фильтры */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="mb-6"
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                  Ваш баланс
                </div>
                <div className="text-h2 font-bold text-light-accent dark:text-dark-accent">
                  {formatPrice(userData?.balance || 0)} поинтов
                </div>
              </div>
              <Button
                variant="primary"
                className="text-small px-3 py-2"
                onClick={() => router.push("/upload")}
              >
                + Загрузить лиды
              </Button>
            </div>
            
            {/* Фильтры */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`flex-1 py-2 px-4 rounded-button text-small font-medium transition-colors ${
                  filter === "all"
                    ? "bg-light-accent dark:bg-dark-accent text-white"
                    : "bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary"
                }`}
              >
                Все ({leads.length})
              </button>
              <button
                onClick={() => setFilter("unique")}
                className={`flex-1 py-2 px-4 rounded-button text-small font-medium transition-colors ${
                  filter === "unique"
                    ? "bg-green-500 text-white"
                    : "bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary"
                }`}
              >
                Уникальные ({leads.filter(l => l.isUnique).length})
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Информация о ценах */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.1, ease: "easeOut" }}
          className="mb-6"
        >
          <Card className="p-4 bg-gradient-to-r from-light-accent/10 to-transparent dark:from-dark-accent/10">
            <div className="text-small font-medium text-light-text dark:text-dark-text mb-2">
              💡 Как работает ценообразование
            </div>
            <div className="text-small text-light-textSecondary dark:text-dark-textSecondary space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span>Уникальный (0 из 3) — <b>1 поинт</b></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>1 из 3 — <b>0.7 поинта</b></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span>2 из 3 — <b>0.3 поинта</b></span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Список лидов */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {isLoading ? (
            <Card className="p-8 text-center">
              <div className="text-body text-light-textSecondary dark:text-dark-textSecondary">
                Загрузка...
              </div>
            </Card>
          ) : filteredLeads.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-body text-light-textSecondary dark:text-dark-textSecondary mb-4">
                {filter === "unique" 
                  ? "Нет уникальных лидов"
                  : "Нет доступных лидов"}
              </div>
              <Button
                variant="primary"
                onClick={() => router.push("/upload")}
              >
                Загрузить лиды
              </Button>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredLeads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  layout
                  variants={{
                    initial: { opacity: 0, y: 8 },
                    animate: { opacity: 1, y: 0 },
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.24, ease: "easeOut", delay: index * 0.04 }}
                >
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Телефон */}
                        <div className="text-body font-mono font-semibold text-light-text dark:text-dark-text mb-1">
                          {lead.phone}
                        </div>
                        
                        {/* Описание */}
                        {lead.comment && (
                          <div className="text-small text-light-textSecondary dark:text-dark-textSecondary mb-2 line-clamp-2">
                            {lead.comment}
                          </div>
                        )}

                        {/* Регион и ниша */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {lead.region && (
                            <span className="text-small px-2 py-0.5 rounded bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary">
                              📍 {lead.region}
                            </span>
                          )}
                          {lead.niche && (
                            <span className="text-small px-2 py-0.5 rounded bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary">
                              🏷️ {lead.niche}
                            </span>
                          )}
                        </div>
                        
                        {/* Статус покупок */}
                        <div className={`inline-flex items-center gap-1.5 text-small px-2 py-1 rounded-full border ${getPurchaseBadgeStyles(lead.purchaseCount, lead.isUnique)}`}>
                          {lead.isUnique ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              Уникальный
                            </>
                          ) : (
                            <>
                              <span className={`w-2 h-2 rounded-full ${lead.purchaseCount === 1 ? 'bg-yellow-500' : 'bg-orange-500'}`} />
                              {lead.purchaseStatus}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Цена и кнопка покупки */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-h3 font-bold text-light-accent dark:text-dark-accent">
                            {formatPrice(lead.price)}
                          </div>
                          <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                            поинтов
                          </div>
                        </div>
                        
                        <Button
                          variant="primary"
                          onClick={() => handleBuyLead(lead.id, lead.price)}
                          disabled={buyingLeadId === lead.id || (userData?.balance || 0) < lead.price}
                          className="min-w-[80px] text-small px-3 py-2"
                        >
                          {buyingLeadId === lead.id ? (
                            <span className="animate-pulse">...</span>
                          ) : (userData?.balance || 0) < lead.price ? (
                            "Мало"
                          ) : (
                            "Купить"
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Подсказка о заработке */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-small text-light-textSecondary dark:text-dark-textSecondary">
            Загружай свои лиды и получай до <b>2 поинтов</b> за каждый!
          </p>
        </motion.div>
      </main>
    </motion.div>
  );
}

