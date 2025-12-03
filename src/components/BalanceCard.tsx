"use client";

import { motion } from "framer-motion";
import { Card } from "./Card";
import { springCounter } from "@/lib/motion";

interface BalanceCardProps {
  balance: number;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

export const BalanceCard = ({
  balance,
  onDeposit,
  onWithdraw,
}: BalanceCardProps) => {
  return (
    <Card className="p-6 mb-6">
      <div className="text-small text-light-textSecondary dark:text-dark-textSecondary mb-2">
        Поинты
      </div>
      <motion.div
        key={balance}
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={springCounter}
        className="text-4xl font-bold text-light-text dark:text-dark-text mb-6"
      >
        {balance.toLocaleString()}
      </motion.div>
      <div className="flex flex-col gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDeposit}
          className="tap-target rounded-button bg-light-accent dark:bg-dark-accent text-white font-semibold shadow-sm hover:shadow-md transition-shadow"
        >
          Пополнить
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onWithdraw}
          className="tap-target rounded-button bg-transparent border-2 border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent font-semibold hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 transition-colors"
        >
          Вывести
        </motion.button>
      </div>
    </Card>
  );
};





