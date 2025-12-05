"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useUser } from "@/hooks/useUser";

export default function ProfilePage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

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
                <h2 className="text-h2 font-bold text-light-text dark:text-dark-text mb-1">
                  {isLoading ? "Загрузка..." : user?.fullName || user?.username || user?.telegramId || "Пользователь"}
                </h2>
                <p className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                  {user?.username && `@${user.username}`}
                  {user?.telegramId && ` • ID: ${user.telegramId}`}
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: "easeOut", delay: 0.1 }}
            >
              <Button
                fullWidth
                variant="secondary"
                onClick={() => {
                  // Настройки
                }}
              >
                Настройки
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
                  // Поддержка
                }}
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

