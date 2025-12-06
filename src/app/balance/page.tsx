"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useUser } from "@/hooks/useUser";
import { useTelegramUser } from "@/hooks/useTelegramUser";
import { useToast } from "@/contexts/ToastContext";
import { formatPrice } from "@/lib/leadPricing";

export default function BalancePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { userId: tgUserId, username: tgUsername, fullName: tgFullName } = useTelegramUser();
  const { data: user, isLoading, refetch } = useUser({ 
    userId: tgUserId || undefined,
    username: tgUsername || undefined,
    fullName: tgFullName || undefined
  });

  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<"card" | "phone">("card");
  const [details, setDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdraw = async () => {
    if (!tgUserId) {
      showToast("Требуется авторизация", "error");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Введите корректную сумму", "error");
      return;
    }

    if (amountNum < 1) {
      showToast("Минимальная сумма: 1 LC", "error");
      return;
    }

    if (amountNum > (user?.balance || 0)) {
      showToast("Недостаточно LC", "error");
      return;
    }

    if (!details.trim()) {
      showToast("Укажите реквизиты для вывода", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/user/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: tgUserId,
          amount: amountNum,
          method,
          details: details.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка вывода");
      }

      showToast(`Заявка на вывод ${amountNum} LC принята!`, "success");
      setAmount("");
      setDetails("");
      refetch();
    } catch (error: any) {
      showToast(error.message || "Ошибка вывода", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [1, 5, 10, 50];

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-24"
    >
      <Header title="Баланс" onProfileClick={() => router.push("/profile")} />
      
      <main className="container-mobile pt-6 pb-8 space-y-4">
        {/* Текущий баланс */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
        >
          <Card className="p-6 bg-gradient-to-br from-light-accent/10 to-transparent dark:from-dark-accent/20">
            <div className="text-center">
              <div className="text-sm text-light-textSecondary dark:text-dark-textSecondary mb-2">
                Ваш баланс
              </div>
              <div className="text-4xl font-bold text-light-accent dark:text-dark-accent mb-1">
                {isLoading ? "..." : formatPrice(user?.balance || 0)} LC
              </div>
              <div className="text-sm text-light-textSecondary dark:text-dark-textSecondary">
                ≈ {Math.round((user?.balance || 0) * 100)} ₽
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Форма вывода */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.1 }}
        >
          <Card className="p-4 space-y-4">
            <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
              Вывод Lead Coin
            </h2>

            {/* Сумма */}
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                Сумма (LC)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                step="0.1"
                className="w-full rounded-xl border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-3 text-lg font-semibold focus:outline-none focus:border-light-accent dark:focus:border-dark-accent"
              />
              {amount && (
                <div className="mt-2 text-sm text-light-textSecondary dark:text-dark-textSecondary">
                  ≈ {Math.round(parseFloat(amount || "0") * 100)} ₽ к выплате
                </div>
              )}
            </div>

            {/* Быстрый выбор */}
            <div className="flex gap-2">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  disabled={(user?.balance || 0) < q}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    amount === String(q)
                      ? "bg-light-accent dark:bg-dark-accent text-white"
                      : (user?.balance || 0) >= q
                        ? "bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text"
                        : "bg-light-surface/50 dark:bg-dark-surface/50 text-light-textSecondary dark:text-dark-textSecondary opacity-50"
                  }`}
                >
                  {q} LC
                </button>
              ))}
              <button
                onClick={() => setAmount(String(user?.balance || 0))}
                disabled={(user?.balance || 0) <= 0}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  amount === String(user?.balance)
                    ? "bg-light-accent dark:bg-dark-accent text-white"
                    : "bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text"
                }`}
              >
                Всё
              </button>
            </div>

            {/* Способ вывода */}
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                Способ вывода
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMethod("card")}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    method === "card"
                      ? "bg-light-accent dark:bg-dark-accent text-white"
                      : "bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary"
                  }`}
                >
                  💳 На карту
                </button>
                <button
                  onClick={() => setMethod("phone")}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    method === "phone"
                      ? "bg-light-accent dark:bg-dark-accent text-white"
                      : "bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary"
                  }`}
                >
                  📱 По номеру
                </button>
              </div>
            </div>

            {/* Реквизиты */}
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                {method === "card" ? "Номер карты" : "Номер телефона"}
              </label>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={method === "card" ? "0000 0000 0000 0000" : "+7 999 123-45-67"}
                className="w-full rounded-xl border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-3 text-sm focus:outline-none focus:border-light-accent dark:focus:border-dark-accent"
              />
            </div>

            {/* Кнопка вывода */}
            <Button
              onClick={handleWithdraw}
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || !details.trim()}
              fullWidth
              className="py-4 text-base"
            >
              {isSubmitting ? "Отправка..." : "Вывести"}
            </Button>

            <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary text-center">
              Курс: 1 LC = 100 ₽ • Вывод в течение 24 часов
            </div>
          </Card>
        </motion.div>

        {/* Как заработать */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.2 }}
        >
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mb-3">
              Как заработать LC?
            </h3>
            <div className="space-y-2 text-sm text-light-textSecondary dark:text-dark-textSecondary">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Загружайте лиды и получайте LC при продаже
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                1 LC за первую продажу лида
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                0.7 LC за вторую и 0.3 LC за третью
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                До 2 LC с каждого лида!
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push("/upload")}
              fullWidth
              className="mt-4 py-3"
            >
              Загрузить лиды
            </Button>
          </Card>
        </motion.div>
      </main>
    </motion.div>
  );
}
