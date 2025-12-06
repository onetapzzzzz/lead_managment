"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useUser } from "@/hooks/useUser";
import { useTelegramUser } from "@/hooks/useTelegramUser";
import { formatPrice } from "@/lib/leadPricing";

export default function ProfilePage() {
  const router = useRouter();
  const { userId, username, fullName } = useTelegramUser();
  const { data: user, isLoading } = useUser({ 
    userId: userId || undefined, 
    username: username || undefined, 
    fullName: fullName || undefined 
  });

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-24"
    >
      <Header title="Профиль" />
      <main className="container-mobile pt-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-light-accent/20 dark:bg-dark-accent/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-light-accent dark:text-dark-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-light-text dark:text-dark-text mb-1">
                  {isLoading ? "Загрузка..." : user?.fullName || user?.username || "Пользователь"}
                </h2>
                <p className="text-sm text-light-textSecondary dark:text-dark-textSecondary">
                  {user?.username && `@${user.username}`}
                  {user?.telegramId && ` • ID: ${user.telegramId}`}
                </p>
              </div>
            </div>

            {/* Баланс */}
            <div className="bg-light-bg dark:bg-dark-bg rounded-xl p-4">
              <div className="text-sm text-light-textSecondary dark:text-dark-textSecondary mb-1">
                Баланс Lead Coin
              </div>
              <div className="text-2xl font-bold text-light-accent dark:text-dark-accent">
                {formatPrice(user?.balance || 0)} LC
              </div>
              <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-1">
                ≈ {Math.round((user?.balance || 0) * 100)} ₽
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: "easeOut", delay: 0.05 }}
            >
              <Button
                fullWidth
                variant="primary"
                onClick={() => router.push("/leads")}
                className="py-3.5"
              >
                Мои лиды
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: "easeOut", delay: 0.1 }}
            >
              <Button
                fullWidth
                variant="secondary"
                onClick={() => router.push("/history")}
                className="py-3.5"
              >
                История транзакций
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: "easeOut", delay: 0.15 }}
            >
              <Button
                fullWidth
                variant="secondary"
                onClick={() => {
                  // Поддержка - открыть бота
                  window.open("https://t.me/board_traff_bot", "_blank");
                }}
                className="py-3.5"
              >
                Поддержка
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </motion.div>
  );
}
