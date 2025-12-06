"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/hooks/useUser";
import { useTelegramUser } from "@/hooks/useTelegramUser";
import { CATEGORIES, REGIONS } from "@/lib/categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function UploadPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { userId: tgUserId, username: tgUsername, fullName: tgFullName } = useTelegramUser();
  
  const [step, setStep] = useState<"category" | "region" | "form" | "result">("category");
  const [subcategory, setSubcategory] = useState("");
  const [region, setRegion] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  
  // Поля лида
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { data: user } = useUser({ 
    userId: tgUserId || undefined,
    username: tgUsername || undefined,
    fullName: tgFullName || undefined
  });

  // Фильтрация регионов
  const filteredRegions = useMemo(() => {
    if (!regionSearch.trim()) return REGIONS;
    const search = regionSearch.toLowerCase();
    return REGIONS.filter(r => r.toLowerCase().includes(search));
  }, [regionSearch]);

  // Валидация телефона
  const normalizePhone = (input: string): string | null => {
    const digits = input.replace(/\D/g, "");
    if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
      return `+7${digits.slice(1)}`;
    }
    if (digits.length === 10) {
      return `+7${digits}`;
    }
    return null;
  };

  const normalizedPhone = normalizePhone(phone);
  const isPhoneValid = !!normalizedPhone;
  const isFormValid = isPhoneValid && name.trim().length >= 2 && comment.trim().length >= 10;

  // Мутация для загрузки одного лида
  const uploadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/leads/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          name: name.trim(),
          comment: comment.trim(),
          region: region || undefined,
          niche: subcategory ? `Окна: ${subcategory}` : "Окна",
          userId: tgUserId,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка загрузки");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const handleSubmit = async () => {
    if (!isFormValid) {
      if (!isPhoneValid) {
        showToast("Введите корректный номер телефона", "error");
      } else if (name.trim().length < 2) {
        showToast("Укажите имя клиента (минимум 2 символа)", "error");
      } else if (comment.trim().length < 10) {
        showToast("Добавьте комментарий (минимум 10 символов)", "error");
      }
      return;
    }

    try {
      await uploadMutation.mutateAsync();
      setResult({
        success: true,
        message: "Лид успешно загружен!",
      });
      setStep("result");
      showToast("Лид добавлен на маркетплейс", "success");
    } catch (error: any) {
      const message = error?.message || "Ошибка загрузки";
      showToast(message, "error");
      if (message.includes("уже существует") || message.includes("дубликат")) {
        setResult({
          success: false,
          message: "Этот номер уже есть в базе",
        });
        setStep("result");
      }
    }
  };

  const handleReset = () => {
    setStep("category");
    setSubcategory("");
    setRegion("");
    setRegionSearch("");
    setPhone("");
    setName("");
    setComment("");
    setResult(null);
  };

  const windowsCategory = CATEGORIES.windows;

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-24"
    >
      <Header title="Загрузка лида" onProfileClick={() => router.push("/profile")} />
      <main className="container-mobile pt-6 pb-8">
        {step === "category" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
            className="space-y-4"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-light-text dark:text-dark-text">
                Выберите подкатегорию
              </h2>
              <p className="text-sm text-light-textSecondary dark:text-dark-textSecondary mt-1">
                Укажите тип лида
              </p>
            </div>
            
            <div className="space-y-2">
              {windowsCategory.subcategories.map((sub) => (
                <Card
                  key={sub.id}
                  className={`p-4 cursor-pointer transition-all ${
                    subcategory === sub.name 
                      ? "ring-2 ring-light-accent dark:ring-dark-accent bg-light-accent/5 dark:bg-dark-accent/5" 
                      : "hover:bg-light-surface/80 dark:hover:bg-dark-surface/80 active:scale-[0.98]"
                  }`}
                  onClick={() => {
                    setSubcategory(sub.name);
                    setStep("region");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-light-text dark:text-dark-text pr-2">
                      {sub.name}
                    </span>
                    <svg className="w-5 h-5 text-light-textSecondary dark:text-dark-textSecondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="text-light-accent dark:text-dark-accent font-medium text-sm py-2"
              >
                ← Назад
              </button>
            </div>
            
            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text">
              Выберите регион
            </h2>
            
            {/* Поиск региона */}
            <div className="relative">
              <input
                type="text"
                value={regionSearch}
                onChange={(e) => setRegionSearch(e.target.value)}
                placeholder="Поиск региона..."
                className="w-full rounded-xl border-2 border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-4 py-3 text-sm focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors"
              />
            </div>

            {/* Список регионов */}
            <div className="max-h-[50vh] overflow-y-auto space-y-1 rounded-xl border border-light-border dark:border-dark-border p-2 no-scrollbar">
              {filteredRegions.length === 0 ? (
                <div className="p-4 text-center text-light-textSecondary dark:text-dark-textSecondary text-sm">
                  Регион не найден
                </div>
              ) : (
                filteredRegions.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRegion(r);
                      setStep("form");
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-sm ${
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
                setStep("form");
              }}
              fullWidth
              className="py-3"
            >
              Пропустить
            </Button>
          </motion.div>
        )}

        {step === "form" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setStep("region")}
                className="text-light-accent dark:text-dark-accent font-medium text-sm py-2"
              >
                ← Назад
              </button>
            </div>
            
            {/* Выбранные параметры */}
            <Card className="p-3">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1.5 rounded-lg bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent font-medium">
                  {subcategory || "Общая категория"}
                </span>
                {region && (
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                    {region}
                  </span>
                )}
              </div>
            </Card>
            
            {/* Форма лида */}
            <Card className="p-4 space-y-4">
              {/* Телефон */}
              <div>
                <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                  Телефон <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 999 123-45-67"
                  className={`w-full rounded-xl border-2 ${
                    phone && !isPhoneValid 
                      ? "border-red-500" 
                      : "border-light-border dark:border-dark-border"
                  } bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-3 text-sm focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors`}
                />
                {phone && !isPhoneValid && (
                  <p className="text-xs text-red-500 mt-1">Введите корректный номер</p>
                )}
                {isPhoneValid && (
                  <p className="text-xs text-green-500 mt-1">✓ {normalizedPhone}</p>
                )}
              </div>

              {/* Имя */}
              <div>
                <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                  Имя клиента <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Михаил"
                  className="w-full rounded-xl border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-3 text-sm focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors"
                />
              </div>

              {/* Комментарий */}
              <div>
                <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                  Комментарий <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={"Москва, м. Румянцево\nОстекление лоджии\nХочет просчет стоимости"}
                  className="w-full min-h-[120px] rounded-xl border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-3 text-sm focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors resize-none"
                />
                <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-1">
                  Укажите адрес, потребность, детали заявки
                </p>
              </div>
            </Card>

            {/* Пример */}
            <Card className="p-4 bg-light-accent/5 dark:bg-dark-accent/5">
              <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary mb-2">
                💡 Пример хорошего комментария:
              </div>
              <div className="text-sm text-light-text dark:text-dark-text whitespace-pre-line">
{`1. Михаил
2. Москва, м. Румянцево
3. Остекление лоджии
4. Хочет просчёт стоимости`}
              </div>
            </Card>

            <Button
              onClick={handleSubmit}
              disabled={uploadMutation.isPending || !isFormValid}
              fullWidth
              className="py-4 text-base"
            >
              {uploadMutation.isPending ? "Загрузка..." : "Загрузить лид"}
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
              <div className="text-4xl mb-4">{result.success ? "✅" : "⚠️"}</div>
              <h2 className="text-xl font-bold text-light-text dark:text-dark-text mb-2">
                {result.message}
              </h2>
              
              {result.success && (
                <div className="mt-4 p-3 rounded-xl bg-light-accent/10 dark:bg-dark-accent/10">
                  <div className="text-sm text-light-accent dark:text-dark-accent font-medium">
                    Lead Coin начислятся при продаже!
                  </div>
                  <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-1">
                    До <b>3.5 LC</b> за лид (2 + 1 + 0.5)
                  </div>
                </div>
              )}
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleReset}
                variant="secondary"
                fullWidth
                className="py-3"
              >
                Загрузить ещё
              </Button>
              <Button
                onClick={() => router.push("/market")}
                fullWidth
                className="py-3"
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
