"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { pageTransition, staggerContainer } from "@/lib/motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useMyLeads } from "@/hooks/useLeads";
import { formatPrice } from "@/lib/leadPricing";

export default function LeadsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"uploaded" | "purchased">("uploaded");
  
  const { data: uploadedData, isLoading: uploadedLoading } = useMyLeads({
    type: "uploaded",
  });
  const { data: purchasedData, isLoading: purchasedLoading } = useMyLeads({
    type: "purchased",
  });

  const isLoading = activeTab === "uploaded" ? uploadedLoading : purchasedLoading;
  const data = activeTab === "uploaded" ? uploadedData : purchasedData;
  const leads = data?.leads || [];
  const stats = data?.stats;

  const getPurchaseBadgeStyles = (purchaseCount: number, isUnique: boolean) => {
    if (isUnique) return "bg-green-500/20 text-green-600 dark:text-green-400";
    if (purchaseCount === 1) return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    if (purchaseCount === 2) return "bg-orange-500/20 text-orange-600 dark:text-orange-400";
    return "bg-red-500/20 text-red-600 dark:text-red-400";
  };

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-24"
    >
      <Header title="Мои лиды" onProfileClick={() => router.push("/profile")} />
      <main className="container-mobile pt-6 pb-8">
        {/* Табы */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="space-y-4 mb-6"
        >
          <div className="flex gap-2 bg-light-surface dark:bg-dark-surface p-1 rounded-card">
            <button
              onClick={() => setActiveTab("uploaded")}
              className={`flex-1 tap-target rounded-button font-semibold text-body transition-colors ${
                activeTab === "uploaded"
                  ? "bg-light-accent dark:bg-dark-accent text-white"
                  : "text-light-textSecondary dark:text-dark-textSecondary"
              }`}
            >
              Загруженные
            </button>
            <button
              onClick={() => setActiveTab("purchased")}
              className={`flex-1 tap-target rounded-button font-semibold text-body transition-colors ${
                activeTab === "purchased"
                  ? "bg-light-accent dark:bg-dark-accent text-white"
                  : "text-light-textSecondary dark:text-dark-textSecondary"
              }`}
            >
              Купленные
            </button>
          </div>
        </motion.div>

        {/* Статистика */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.1, ease: "easeOut" }}
            className="mb-6"
          >
            <Card className="p-4">
              {activeTab === "uploaded" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                      Всего загружено
                    </div>
                    <div className="text-h3 font-bold text-light-text dark:text-dark-text">
                      {stats.totalUploaded}
                    </div>
                  </div>
                  <div>
                    <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                      Заработано
                    </div>
                    <div className="text-h3 font-bold text-green-600 dark:text-green-400">
                      +{formatPrice(stats.totalReward || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                      На маркете
                    </div>
                    <div className="text-h3 font-bold text-light-accent dark:text-dark-accent">
                      {stats.inMarket}
                    </div>
                  </div>
                  <div>
                    <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                      В архиве
                    </div>
                    <div className="text-h3 font-bold text-light-textSecondary dark:text-dark-textSecondary">
                      {stats.archived}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                      Всего куплено
                    </div>
                    <div className="text-h3 font-bold text-light-text dark:text-dark-text">
                      {stats.totalPurchased}
                    </div>
                  </div>
                  <div>
                    <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                      Потрачено
                    </div>
                    <div className="text-h3 font-bold text-light-accent dark:text-dark-accent">
                      {formatPrice(stats.totalSpent || 0)}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

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
          ) : leads.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-body text-light-textSecondary dark:text-dark-textSecondary mb-4">
                {activeTab === "uploaded"
                  ? "Вы ещё не загружали лиды"
                  : "Вы ещё не покупали лиды"}
              </div>
              <Button
                variant="primary"
                onClick={() => router.push(activeTab === "uploaded" ? "/upload" : "/market")}
              >
                {activeTab === "uploaded" ? "Загрузить лиды" : "Перейти в маркет"}
              </Button>
            </Card>
          ) : (
            leads.map((lead: any, index: number) => (
              <motion.div
                key={lead.id}
                variants={{
                  initial: { opacity: 0, y: 8 },
                  animate: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.24, ease: "easeOut", delay: index * 0.04 }}
              >
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-body font-mono font-semibold text-light-text dark:text-dark-text mb-1">
                        {lead.phone}
                      </div>
                      
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

                      {activeTab === "uploaded" && (
                        <div className={`inline-flex items-center gap-1.5 text-small px-2 py-1 rounded-full ${
                          getPurchaseBadgeStyles(lead.purchaseCount, lead.isUnique)
                        }`}>
                          {lead.isArchived ? (
                            <>📦 Архив (3 из 3)</>
                          ) : lead.isUnique ? (
                            <>✨ Уникальный</>
                          ) : (
                            <>{lead.purchaseStatus}</>
                          )}
                        </div>
                      )}

                      {activeTab === "purchased" && (
                        <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                          Куплен {new Date(lead.purchasedAt).toLocaleDateString("ru-RU")}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      {activeTab === "uploaded" ? (
                        <>
                          <div className="text-right">
                            <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                              Заработано
                            </div>
                            <div className="text-body font-bold text-green-600 dark:text-green-400">
                              +{formatPrice(lead.ownerReward)}
                            </div>
                          </div>
                          {!lead.isArchived && lead.nextPrice && (
                            <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                              След: {formatPrice(lead.nextPrice)} п.
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-right">
                          <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                            Заплачено
                          </div>
                          <div className="text-body font-bold text-light-accent dark:text-dark-accent">
                            {formatPrice(lead.pricePaid)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </main>
    </motion.div>
  );
}
