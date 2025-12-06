"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { parsePhonesFromText } from "@/lib/phoneParser";
import { useToast } from "@/contexts/ToastContext";
import { useUploadBatch } from "@/hooks/useUploadBatch";
import { useUser } from "@/hooks/useUser";
import { useTelegramUser } from "@/hooks/useTelegramUser";
import { CATEGORIES, REGIONS } from "@/lib/categories";

export default function UploadPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { userId: tgUserId } = useTelegramUser();
  const [step, setStep] = useState<"category" | "region" | "text" | "result">("category");
  const [subcategory, setSubcategory] = useState("");
  const [region, setRegion] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  const [description, setDescription] = useState("");
  const [rawText, setRawText] = useState("");
  const uploadBatchMutation = useUploadBatch();
  const { data: user } = useUser(tgUserId || undefined);
  const [result, setResult] = useState<{
    totalUploaded: number;
    totalValid: number;
    duplicatesRejected: number;
    message: string;
  } | null>(null);

  const parsedPhones = rawText ? parsePhonesFromText(rawText) : [];
  const validCount = parsedPhones.length;

  // Фильтрация регионов
  const filteredRegions = useMemo(() => {
    if (!regionSearch.trim()) return REGIONS;
    const search = regionSearch.toLowerCase();
    return REGIONS.filter(r => r.toLowerCase().includes(search));
  }, [regionSearch]);

  const handleSubmit = async () => {
    if (!rawText.trim()) {
      showToast("Введите текст с телефонами", "error");
      return;
    }

    if (validCount === 0) {
      showToast("Телефоны не найдены в тексте", "error");
      return;
    }

    try {
      const data = await uploadBatchMutation.mutateAsync({
        rawText,
        niche: subcategory ? `Окна: ${subcategory}` : "Окна",
        region: region || undefined,
        description: description.trim() || undefined,
        userId: tgUserId || undefined,
      });

      setResult({
        totalUploaded: data.batch.totalUploaded,
        totalValid: data.batch.totalValid,
        duplicatesRejected: data.batch.duplicatesRejected,
        message: data.message,
      });
      setStep("result");
      showToast(data.message || `Загружено ${data.batch.totalValid} лидов`, "success");
    } catch (error: any) {
      const message = error?.message || "Ошибка загрузки";
      showToast(message.length > 50 ? message.substring(0, 47) + "..." : message, "error");
    }
  };

  const handleReset = () => {
    setStep("category");
    setSubcategory("");
    setRegion("");
    setRegionSearch("");
    setDescription("");
    setRawText("");
    setResult(null);
  };

  const windowsCategory = CATEGORIES.windows;

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-24"
    >
      <Header title="Загрузка лидов" onProfileClick={() => router.push("/profile")} />
      <main className="container-mobile pt-6 pb-8">
        {step === "category" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{windowsCategory.icon}</span>
              <div>
                <h2 className="text-h2 font-semibold text-light-text dark:text-dark-text">
                  {windowsCategory.name}
                </h2>
                <p className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                  Выберите подкатегорию
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              {windowsCategory.subcategories.map((sub) => (
                <Card
                  key={sub.id}
                  className={`p-4 cursor-pointer transition-all ${
                    subcategory === sub.name 
                      ? "ring-2 ring-light-accent dark:ring-dark-accent bg-light-accent/5 dark:bg-dark-accent/5" 
                      : "hover:bg-light-surface/80 dark:hover:bg-dark-surface/80"
                  }`}
                  onClick={() => {
                    setSubcategory(sub.name);
                    setStep("region");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-body text-light-text dark:text-dark-text">
                      {sub.name}
                    </span>
                    <svg className="w-5 h-5 text-light-textSecondary dark:text-dark-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {step === "region" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setStep("category")}
                className="tap-target text-light-accent dark:text-dark-accent font-medium"
              >
                ← Назад
              </button>
            </div>
            
            <h2 className="text-h2 font-semibold text-light-text dark:text-dark-text">
              Выберите регион
            </h2>
            
            {/* Поиск региона */}
            <div className="relative">
              <input
                type="text"
                value={regionSearch}
                onChange={(e) => setRegionSearch(e.target.value)}
                placeholder="🔍 Поиск региона..."
                className="w-full rounded-button border-2 border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-4 py-3 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors"
              />
            </div>

            {/* Список регионов */}
            <div className="max-h-[50vh] overflow-y-auto space-y-1 rounded-card border border-light-border dark:border-dark-border p-2 no-scrollbar">
              {filteredRegions.length === 0 ? (
                <div className="p-4 text-center text-light-textSecondary dark:text-dark-textSecondary">
                  Регион не найден
                </div>
              ) : (
                filteredRegions.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRegion(r);
                      setStep("text");
                    }}
                    className={`w-full text-left px-4 py-3 rounded-button transition-colors ${
                      region === r
                        ? "bg-light-accent dark:bg-dark-accent text-white"
                        : "hover:bg-light-surface dark:hover:bg-dark-surface text-light-text dark:text-dark-text"
                    }`}
                  >
                    {r}
                  </button>
                ))
              )}
            </div>

            <Button
              variant="secondary"
              onClick={() => {
                setRegion("");
                setStep("text");
              }}
              fullWidth
            >
              Пропустить выбор региона
            </Button>
          </motion.div>
        )}

        {step === "text" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setStep("region")}
                className="tap-target text-light-accent dark:text-dark-accent font-medium"
              >
                ← Назад
              </button>
            </div>
            
            {/* Выбранные параметры */}
            <Card className="p-3">
              <div className="flex flex-wrap gap-2">
                <span className="text-small px-3 py-1 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent font-medium">
                  🪟 {subcategory || "Окна"}
                </span>
                {region && (
                  <span className="text-small px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                    📍 {region}
                  </span>
                )}
              </div>
            </Card>
            
            {/* Описание */}
            <Card className="p-4">
              <label className="block text-small font-medium text-light-text dark:text-dark-text mb-2">
                📝 Комментарий (необязательно)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Например: горячие лиды с выставки, интересуются остеклением..."
                className="w-full min-h-[80px] rounded-button border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-3 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors resize-none"
              />
            </Card>

            {/* Телефоны */}
            <Card className="p-4">
              <label className="block text-small font-medium text-light-text dark:text-dark-text mb-2">
                📞 Телефоны <span className="text-light-error dark:text-dark-error">*</span>
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={"+7 999 123-45-67\n8 (912) 345-67-89\nили любой текст с номерами..."}
                className="w-full min-h-[150px] rounded-button border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-3 text-body font-mono focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors resize-none"
                autoFocus
              />
              {rawText ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${validCount > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                    Найдено телефонов: <span className={`font-semibold ${validCount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{validCount}</span>
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-small text-light-textSecondary dark:text-dark-textSecondary">
                  Вставьте номера в любом формате — мы их автоматически распарсим
                </div>
              )}
            </Card>

            <Button
              onClick={handleSubmit}
              disabled={uploadBatchMutation.isPending || validCount === 0}
              fullWidth
              className="h-14"
            >
              {uploadBatchMutation.isPending ? "Загрузка..." : `Загрузить ${validCount > 0 ? validCount + ' лидов' : ''}`}
            </Button>
          </motion.div>
        )}

        {step === "result" && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.24 }}
            className="space-y-4"
          >
            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">{result.totalValid > 0 ? "✅" : "⚠️"}</div>
              <h2 className="text-h2 font-bold text-light-text dark:text-dark-text mb-2">
                {result.totalValid > 0 ? "Загрузка завершена!" : "Лиды не добавлены"}
              </h2>
              <div className="space-y-2 text-body text-light-textSecondary dark:text-dark-textSecondary">
                <div>Найдено номеров: <span className="font-semibold text-light-text dark:text-dark-text">{result.totalUploaded}</span></div>
                <div>Добавлено новых: <span className="font-semibold text-light-success dark:text-dark-success">{result.totalValid}</span></div>
                {result.duplicatesRejected > 0 && (
                  <div>Дубликатов: <span className="font-semibold text-orange-500">{result.duplicatesRejected}</span></div>
                )}
              </div>
              
              {result.totalValid > 0 && (
                <div className="mt-4 p-3 rounded-card bg-light-accent/10 dark:bg-dark-accent/10">
                  <div className="text-small text-light-accent dark:text-dark-accent font-medium">
                    💡 Поинты начислятся, когда лиды купят!
                  </div>
                  <div className="text-small text-light-textSecondary dark:text-dark-textSecondary mt-1">
                    До <b>2 поинтов</b> за каждый лид (1 + 0.7 + 0.3)
                  </div>
                </div>
              )}
            </Card>
            <div className="flex gap-3">
              <Button
                onClick={handleReset}
                variant="secondary"
                fullWidth
              >
                Загрузить ещё
              </Button>
              <Button
                onClick={() => router.push("/market")}
                fullWidth
              >
                В маркет
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}
