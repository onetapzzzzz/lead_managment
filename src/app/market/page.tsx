"use client";

import { useState, useMemo } from "react";
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
import { CATEGORIES, REGIONS } from "@/lib/categories";

export default function MarketPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: userData, refetch: refetchUser } = useUser();
  const { data: marketData, isLoading, refetch: refetchMarket } = useMarketLeads();
  const buyLead = useBuyLead();

  const [buyingLeadId, setBuyingLeadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unique">("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const leads = marketData?.leads || [];
  
  // Фильтрация лидов
  const filteredLeads = useMemo(() => {
    let result = leads;
    
    if (filter === "unique") {
      result = result.filter(l => l.isUnique);
    }
    
    if (subcategoryFilter) {
      result = result.filter(l => l.niche?.includes(subcategoryFilter));
    }
    
    if (regionFilter) {
      result = result.filter(l => l.region === regionFilter);
    }
    
    return result;
  }, [leads, filter, subcategoryFilter, regionFilter]);

  // Уникальные регионы из лидов
  const availableRegions = useMemo(() => {
    const regions = new Set(leads.map(l => l.region).filter(Boolean));
    return Array.from(regions).sort();
  }, [leads]);

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

  const clearFilters = () => {
    setFilter("all");
    setSubcategoryFilter("");
    setRegionFilter("");
  };

  const hasActiveFilters = filter !== "all" || subcategoryFilter || regionFilter;

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-24"
    >
      <Header title="Маркетплейс" onProfileClick={() => router.push("/profile")} />
      
      <main className="container-mobile pt-6 pb-8">
        {/* Баланс */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="mb-4"
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                  Ваш баланс
                </div>
                <div className="text-h2 font-bold text-light-accent dark:text-dark-accent">
                  {formatPrice(userData?.balance || 0)} п.
                </div>
              </div>
              <Button
                variant="primary"
                className="text-small px-3 py-2"
                onClick={() => router.push("/upload")}
              >
                + Загрузить
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Фильтры */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.05 }}
          className="mb-4"
        >
          {/* Быстрые фильтры */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 py-2.5 px-4 rounded-button text-small font-medium transition-all ${
                filter === "all"
                  ? "bg-light-accent dark:bg-dark-accent text-white shadow-sm"
                  : "bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary"
              }`}
            >
              Все ({leads.length})
            </button>
            <button
              onClick={() => setFilter("unique")}
              className={`flex-1 py-2.5 px-4 rounded-button text-small font-medium transition-all ${
                filter === "unique"
                  ? "bg-green-500 text-white shadow-sm"
                  : "bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary"
              }`}
            >
              ✨ Уникальные ({leads.filter(l => l.isUnique).length})
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`py-2.5 px-3 rounded-button text-small font-medium transition-all ${
                showFilters || hasActiveFilters
                  ? "bg-light-accent dark:bg-dark-accent text-white"
                  : "bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary"
              }`}
            >
              ⚙️
            </button>
          </div>

          {/* Расширенные фильтры */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="p-4 space-y-3">
                  {/* Подкатегория */}
                  <div>
                    <label className="block text-small font-medium text-light-text dark:text-dark-text mb-2">
                      🪟 Подкатегория
                    </label>
                    <select
                      value={subcategoryFilter}
                      onChange={(e) => setSubcategoryFilter(e.target.value)}
                      className="w-full rounded-button border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-3 py-2.5 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent"
                    >
                      <option value="">Все подкатегории</option>
                      {CATEGORIES.windows.subcategories.map((sub) => (
                        <option key={sub.id} value={sub.name}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Регион */}
                  <div>
                    <label className="block text-small font-medium text-light-text dark:text-dark-text mb-2">
                      📍 Регион
                    </label>
                    <select
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      className="w-full rounded-button border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-3 py-2.5 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent"
                    >
                      <option value="">Все регионы</option>
                      {availableRegions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {hasActiveFilters && (
                    <Button
                      variant="secondary"
                      onClick={clearFilters}
                      fullWidth
                      className="text-small"
                    >
                      Сбросить фильтры
                    </Button>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Активные фильтры */}
          {hasActiveFilters && !showFilters && (
            <div className="flex flex-wrap gap-2 mt-2">
              {subcategoryFilter && (
                <span className="text-small px-2 py-1 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent">
                  🪟 {subcategoryFilter.length > 20 ? subcategoryFilter.substring(0, 20) + "..." : subcategoryFilter}
                </span>
              )}
              {regionFilter && (
                <span className="text-small px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                  📍 {regionFilter}
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Информация о ценах */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.1, ease: "easeOut" }}
          className="mb-4"
        >
          <Card className="p-3 bg-gradient-to-r from-light-accent/5 to-transparent dark:from-dark-accent/10">
            <div className="flex items-center gap-4 text-small">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-light-textSecondary dark:text-dark-textSecondary">1п.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-light-textSecondary dark:text-dark-textSecondary">0.7п.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-light-textSecondary dark:text-dark-textSecondary">0.3п.</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Результаты фильтрации */}
        {hasActiveFilters && (
          <div className="mb-3 text-small text-light-textSecondary dark:text-dark-textSecondary">
            Найдено: {filteredLeads.length} из {leads.length}
          </div>
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
          ) : filteredLeads.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-3xl mb-3">📭</div>
              <div className="text-body text-light-textSecondary dark:text-dark-textSecondary mb-4">
                {hasActiveFilters 
                  ? "Нет лидов по выбранным фильтрам"
                  : "Нет доступных лидов"}
              </div>
              {hasActiveFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Сбросить фильтры
                </Button>
              ) : (
                <Button variant="primary" onClick={() => router.push("/upload")}>
                  Загрузить лиды
                </Button>
              )}
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
                  transition={{ duration: 0.24, ease: "easeOut", delay: index * 0.03 }}
                >
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
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
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {lead.region && (
                            <span className="text-small px-2 py-0.5 rounded bg-light-bg dark:bg-dark-bg text-light-textSecondary dark:text-dark-textSecondary">
                              📍 {lead.region}
                            </span>
                          )}
                          {lead.niche && (
                            <span className="text-small px-2 py-0.5 rounded bg-light-bg dark:bg-dark-bg text-light-textSecondary dark:text-dark-textSecondary">
                              🪟 {lead.niche.replace("Окна: ", "")}
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
      </main>
    </motion.div>
  );
}
