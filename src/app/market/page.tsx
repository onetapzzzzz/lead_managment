"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition, staggerContainer } from "@/lib/motion";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useMarketLeads, useBuyLead } from "@/hooks/useLeads";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/contexts/ToastContext";
import { formatPrice } from "@/lib/leadPricing";
import { 
  CATEGORIES, 
  REGIONS, 
  REGIONS_WITH_CITIES,
  getCitiesByRegion,
  SORT_OPTIONS,
  UNIQUENESS_OPTIONS,
  CONDITION_OPTIONS
} from "@/lib/categories";

export default function MarketPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: userData, refetch: refetchUser } = useUser();
  const { data: marketData, isLoading, refetch: refetchMarket } = useMarketLeads();
  const buyLead = useBuyLead();

  const [buyingLeadId, setBuyingLeadId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Фильтры
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [priceFromFilter, setPriceFromFilter] = useState<string>("");
  const [priceToFilter, setPriceToFilter] = useState<string>("");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [uniquenessFilter, setUniquenessFilter] = useState<string>("");
  const [conditionFilter, setConditionFilter] = useState<string>("");
  
  // Сортировка
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Поиск региона/города
  const [regionSearch, setRegionSearch] = useState<string>("");

  const leads = marketData?.leads || [];
  
  // Фильтрация регионов
  const filteredRegions = useMemo(() => {
    if (!regionSearch.trim()) return REGIONS;
    const search = regionSearch.toLowerCase();
    return REGIONS.filter(r => r.toLowerCase().includes(search));
  }, [regionSearch]);

  // Города для выбранного региона
  const citiesForRegion = useMemo(() => {
    if (!regionFilter) return [];
    return getCitiesByRegion(regionFilter);
  }, [regionFilter]);

  // При смене региона сбрасываем город
  useEffect(() => {
    setCityFilter("");
  }, [regionFilter]);

  // Фильтрация лидов на клиенте
  const filteredLeads = useMemo(() => {
    let result = leads;
    
    if (subcategoryFilter) {
      result = result.filter(l => l.subcategory === subcategoryFilter || l.niche?.includes(subcategoryFilter));
    }
    
    if (regionFilter) {
      result = result.filter(l => l.region === regionFilter);
    }
    
    if (cityFilter) {
      result = result.filter(l => (l as any).city === cityFilter);
    }
    
    if (priceFromFilter) {
      const priceFrom = parseFloat(priceFromFilter);
      result = result.filter(l => l.price >= priceFrom);
    }
    
    if (priceToFilter) {
      const priceTo = parseFloat(priceToFilter);
      result = result.filter(l => l.price <= priceTo);
    }
    
    if (dateFromFilter) {
      const dateFrom = new Date(dateFromFilter);
      result = result.filter(l => new Date(l.createdAt) >= dateFrom);
    }
    
    if (dateToFilter) {
      const dateTo = new Date(dateToFilter);
      dateTo.setHours(23, 59, 59, 999);
      result = result.filter(l => new Date(l.createdAt) <= dateTo);
    }
    
    if (uniquenessFilter === "unique") {
      result = result.filter(l => l.purchaseCount === 0);
    } else if (uniquenessFilter === "1") {
      result = result.filter(l => l.purchaseCount === 1);
    } else if (uniquenessFilter === "2") {
      result = result.filter(l => l.purchaseCount === 2);
    }
    
    if (conditionFilter === "new") {
      result = result.filter(l => l.purchaseCount === 0);
    } else if (conditionFilter === "secondary") {
      result = result.filter(l => l.purchaseCount > 0);
    }
    
    // Сортировка
    switch (sortBy) {
      case "newest":
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "price_high":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "price_low":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "bought_1":
        result = result.filter(l => l.purchaseCount === 1);
        break;
      case "bought_2":
        result = result.filter(l => l.purchaseCount === 2);
        break;
    }
    
    return result;
  }, [leads, subcategoryFilter, regionFilter, cityFilter, priceFromFilter, priceToFilter, dateFromFilter, dateToFilter, uniquenessFilter, conditionFilter, sortBy]);

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
    setSubcategoryFilter("");
    setRegionFilter("");
    setCityFilter("");
    setPriceFromFilter("");
    setPriceToFilter("");
    setDateFromFilter("");
    setDateToFilter("");
    setUniquenessFilter("");
    setConditionFilter("");
    setSortBy("newest");
    setRegionSearch("");
  };

  const hasActiveFilters = subcategoryFilter || regionFilter || cityFilter || priceFromFilter || priceToFilter || dateFromFilter || dateToFilter || uniquenessFilter || conditionFilter;

  const windowsCategory = CATEGORIES.windows;

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-24"
    >
      {/* Шапка с балансом */}
      <div className="sticky top-0 z-40 bg-light-bg/95 dark:bg-dark-bg/95 backdrop-blur-sm border-b border-light-border dark:border-dark-border">
        <div className="container-mobile py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-h2 font-bold text-light-text dark:text-dark-text">
              🛒 Маркетплейс
            </h1>
            
            {/* Баланс справа */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                  Баланс
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-body font-bold text-light-accent dark:text-dark-accent">
                    {formatPrice(userData?.balance || 0)} п.
                  </span>
                  <span className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                    ≈ {Math.round((userData?.balance || 0) * 100)} ₽
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="container-mobile pt-4 pb-8">
        {/* Сортировка */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="mb-4"
        >
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={`whitespace-nowrap py-2 px-4 rounded-full text-small font-medium transition-all ${
                  sortBy === option.id
                    ? "bg-light-accent dark:bg-dark-accent text-white shadow-sm"
                    : "bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary"
                }`}
              >
                {option.name}
              </button>
            ))}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`whitespace-nowrap py-2 px-4 rounded-full text-small font-medium transition-all flex items-center gap-1.5 ${
                showFilters || hasActiveFilters
                  ? "bg-light-accent dark:bg-dark-accent text-white"
                  : "bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary"
              }`}
            >
              ⚙️ Фильтры
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Расширенные фильтры */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <Card className="p-4 space-y-4">
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
                    {windowsCategory.subcategories.map((sub) => (
                      <option key={sub.id} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                {/* Гео: Регион */}
                <div>
                  <label className="block text-small font-medium text-light-text dark:text-dark-text mb-2">
                    📍 Регион (область)
                  </label>
                  <input
                    type="text"
                    value={regionSearch}
                    onChange={(e) => setRegionSearch(e.target.value)}
                    placeholder="🔍 Поиск региона..."
                    className="w-full rounded-button border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-3 py-2.5 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent mb-2"
                  />
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full rounded-button border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-3 py-2.5 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent"
                  >
                    <option value="">Вся Россия</option>
                    {filteredRegions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Гео: Город */}
                {regionFilter && citiesForRegion.length > 0 && (
                  <div>
                    <label className="block text-small font-medium text-light-text dark:text-dark-text mb-2">
                      🏙️ Город
                    </label>
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="w-full rounded-button border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-3 py-2.5 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent"
                    >
                      <option value="">Весь регион</option>
                      {citiesForRegion.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Цена */}
                <div>
                  <label className="block text-small font-medium text-light-text dark:text-dark-text mb-2">
                    💰 Цена (поинты)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={priceFromFilter}
                      onChange={(e) => setPriceFromFilter(e.target.value)}
                      placeholder="От"
                      step="0.1"
                      min="0"
                      className="flex-1 rounded-button border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-3 py-2.5 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent"
                    />
                    <input
                      type="number"
                      value={priceToFilter}
                      onChange={(e) => setPriceToFilter(e.target.value)}
                      placeholder="До"
                      step="0.1"
                      min="0"
                      className="flex-1 rounded-button border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-3 py-2.5 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent"
                    />
                  </div>
                </div>

                {/* Дата добавления */}
                <div>
                  <label className="block text-small font-medium text-light-text dark:text-dark-text mb-2">
                    📅 Дата добавления
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateFromFilter}
                      onChange={(e) => setDateFromFilter(e.target.value)}
                      className="flex-1 rounded-button border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-3 py-2.5 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent"
                    />
                    <input
                      type="date"
                      value={dateToFilter}
                      onChange={(e) => setDateToFilter(e.target.value)}
                      className="flex-1 rounded-button border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-3 py-2.5 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent"
                    />
                  </div>
                </div>

                {/* Уникальность */}
                <div>
                  <label className="block text-small font-medium text-light-text dark:text-dark-text mb-2">
                    ✨ Уникальность
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {UNIQUENESS_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setUniquenessFilter(option.id)}
                        className={`py-2 px-3 rounded-button text-small font-medium transition-all ${
                          uniquenessFilter === option.id
                            ? "bg-light-accent dark:bg-dark-accent text-white"
                            : "bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary"
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Состояние */}
                <div>
                  <label className="block text-small font-medium text-light-text dark:text-dark-text mb-2">
                    📊 Состояние лида
                  </label>
                  <div className="flex gap-2">
                    {CONDITION_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setConditionFilter(option.id)}
                        className={`flex-1 py-2 px-3 rounded-button text-small font-medium transition-all ${
                          conditionFilter === option.id
                            ? "bg-light-accent dark:bg-dark-accent text-white"
                            : "bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary"
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    onClick={clearFilters}
                    fullWidth
                    className="text-small"
                  >
                    Сбросить
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setShowFilters(false)}
                    fullWidth
                    className="text-small"
                  >
                    Применить
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Активные фильтры */}
        {hasActiveFilters && !showFilters && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 mb-4"
          >
            {subcategoryFilter && (
              <span className="text-small px-2 py-1 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent flex items-center gap-1">
                🪟 {subcategoryFilter.length > 15 ? subcategoryFilter.substring(0, 15) + "..." : subcategoryFilter}
                <button onClick={() => setSubcategoryFilter("")} className="ml-1 opacity-60 hover:opacity-100">✕</button>
              </span>
            )}
            {regionFilter && (
              <span className="text-small px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-1">
                📍 {regionFilter}
                <button onClick={() => setRegionFilter("")} className="ml-1 opacity-60 hover:opacity-100">✕</button>
              </span>
            )}
            {cityFilter && (
              <span className="text-small px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                🏙️ {cityFilter}
                <button onClick={() => setCityFilter("")} className="ml-1 opacity-60 hover:opacity-100">✕</button>
              </span>
            )}
            {uniquenessFilter && (
              <span className="text-small px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                ✨ {UNIQUENESS_OPTIONS.find(o => o.id === uniquenessFilter)?.name}
                <button onClick={() => setUniquenessFilter("")} className="ml-1 opacity-60 hover:opacity-100">✕</button>
              </span>
            )}
            {conditionFilter && (
              <span className="text-small px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center gap-1">
                {conditionFilter === "new" ? "🆕 Новый" : "🔄 Вторичка"}
                <button onClick={() => setConditionFilter("")} className="ml-1 opacity-60 hover:opacity-100">✕</button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-small px-2 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400"
            >
              Сбросить все
            </button>
          </motion.div>
        )}

        {/* Статистика */}
        <div className="mb-4 flex items-center justify-between text-small text-light-textSecondary dark:text-dark-textSecondary">
          <span>Найдено: {filteredLeads.length} из {leads.length}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>1п.</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>0.7п.</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>0.3п.</span>
            </div>
          </div>
        </div>

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
                  transition={{ duration: 0.24, ease: "easeOut", delay: index * 0.02 }}
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

                        {/* Теги */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {lead.region && (
                            <span className="text-small px-2 py-0.5 rounded bg-light-bg dark:bg-dark-bg text-light-textSecondary dark:text-dark-textSecondary">
                              📍 {lead.region}
                            </span>
                          )}
                          {lead.subcategory && lead.subcategory !== "Окна" && (
                            <span className="text-small px-2 py-0.5 rounded bg-light-bg dark:bg-dark-bg text-light-textSecondary dark:text-dark-textSecondary">
                              🪟 {lead.subcategory.length > 20 ? lead.subcategory.substring(0, 20) + "..." : lead.subcategory}
                            </span>
                          )}
                        </div>
                        
                        {/* Статус */}
                        <div className="flex items-center gap-2">
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
                          <span className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                            {new Date(lead.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Цена и покупка */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-h3 font-bold text-light-accent dark:text-dark-accent">
                            {formatPrice(lead.price)}
                          </div>
                          <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                            ≈ {Math.round(lead.price * 100)} ₽
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
