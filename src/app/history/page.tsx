"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { pageTransition, staggerContainer } from "@/lib/motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { useTransactions } from "@/hooks/useTransactions";
import { formatDate } from "@/lib/utils";

export default function HistoryPage() {
  const router = useRouter();
  const { data: transactionsData, isLoading } = useTransactions();

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Пополнение";
      case "withdraw":
        return "Вывод";
      case "purchase":
        return "Покупка";
      default:
        return "Операция";
    }
  };

  const transactions = transactionsData?.transactions || [];

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-20 pb-safe-bottom"
    >
      <Header title="История" onProfileClick={() => router.push("/profile")} />
      <main className="container-mobile pt-6 pb-6">
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
          ) : transactions.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-body text-light-textSecondary dark:text-dark-textSecondary">
                Нет транзакций
              </div>
            </Card>
          ) : (
            transactions.map((transaction, index) => {
              const isPositive = transaction.type === "deposit";
              const displayAmount = isPositive ? transaction.amount : -transaction.amount;
              return (
                <motion.div
                  key={transaction.id}
                  variants={{
                    initial: { opacity: 0, y: 8 },
                    animate: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.24, ease: "easeOut", delay: index * 0.04 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-body font-semibold text-light-text dark:text-dark-text mb-1">
                          {getTypeLabel(transaction.type)}
                        </div>
                        <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>
                      <div
                        className={`text-body font-bold ${
                          isPositive
                            ? "text-light-success dark:text-dark-success"
                            : "text-light-error dark:text-dark-error"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {displayAmount.toLocaleString()} ₽
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </main>
    </motion.div>
  );
}

