"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import { Header } from "@/components/Header";
import { BalanceCard } from "@/components/BalanceCard";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { useUser, useUpdateBalance } from "@/hooks/useUser";
import { useToast } from "@/contexts/ToastContext";

export default function BalancePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: user } = useUser();
  const updateBalanceMutation = useUpdateBalance();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDetails, setWithdrawDetails] = useState("");

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount <= 0) {
      showToast("Введите сумму", "error");
      return;
    }
    if (amount > 1000000) {
      showToast("Слишком большая сумма", "error");
      return;
    }

    try {
      await updateBalanceMutation.mutateAsync({ amount, type: "deposit" });
      setIsDepositModalOpen(false);
      setDepositAmount("");
      showToast("Баланс пополнен", "success");
    } catch (error: any) {
      const message = error?.message || "Ошибка";
      showToast(message.length > 50 ? message.substring(0, 47) + "..." : message, "error");
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount <= 0) {
      showToast("Введите сумму", "error");
      return;
    }
    if (amount > (user?.balance || 0)) {
      showToast("Недостаточно средств", "error");
      return;
    }
    if (!withdrawDetails.trim()) {
      showToast("Введите реквизиты", "error");
      return;
    }

    try {
      await updateBalanceMutation.mutateAsync({ amount, type: "withdraw" });
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
      setWithdrawDetails("");
      showToast("Запрос отправлен", "success");
    } catch (error: any) {
      const message = error?.message || "Ошибка";
      showToast(message.length > 50 ? message.substring(0, 47) + "..." : message, "error");
    }
  };

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-20 pb-safe-bottom"
    >
      <Header title="Баланс" onProfileClick={() => router.push("/profile")} />
      <main className="container-mobile pt-6 pb-6">
        <BalanceCard
          balance={user?.balance || 0}
          onDeposit={() => setIsDepositModalOpen(true)}
          onWithdraw={() => setIsWithdrawModalOpen(true)}
        />
      </main>

      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title="Пополнить баланс"
        footer={
          <>
            <Button
              onClick={handleDeposit}
              disabled={updateBalanceMutation.isPending}
              fullWidth
            >
              {updateBalanceMutation.isPending ? "..." : "Пополнить"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsDepositModalOpen(false)}
              fullWidth
            >
              Отмена
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-small text-light-textSecondary dark:text-dark-textSecondary mb-2">
              Сумма пополнения
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Введите сумму"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full tap-target rounded-button border-2 border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-4 py-3 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors"
              autoComplete="off"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title="Вывести средства"
        footer={
          <>
            <Button
              onClick={handleWithdraw}
              disabled={updateBalanceMutation.isPending}
              fullWidth
            >
              {updateBalanceMutation.isPending ? "..." : "Вывести"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsWithdrawModalOpen(false)}
              fullWidth
            >
              Отмена
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-small text-light-textSecondary dark:text-dark-textSecondary mb-2">
              Сумма вывода
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Введите сумму"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full tap-target rounded-button border-2 border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-4 py-3 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-small text-light-textSecondary dark:text-dark-textSecondary mb-2">
              Реквизиты
            </label>
            <input
              type="text"
              inputMode="text"
              placeholder="Введите реквизиты"
              value={withdrawDetails}
              onChange={(e) => setWithdrawDetails(e.target.value)}
              className="w-full tap-target rounded-button border-2 border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-4 py-3 text-body focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors"
              autoComplete="off"
            />
          </div>
        </div>
      </Modal>

    </motion.div>
  );
}

