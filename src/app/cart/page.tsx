"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { pageTransition, staggerContainer } from "@/lib/motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useCart } from "@/contexts/CartContext";
import { useBuyLead } from "@/hooks/useLeads";
import { useToast } from "@/contexts/ToastContext";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, clearCart, totalPrice } = useCart();
  const buyLeadMutation = useBuyLead();
  const { showToast } = useToast();

  const handleBuyAll = async () => {
    if (!items.length) return;

    try {
      for (const item of items) {
        await buyLeadMutation.mutateAsync({ leadId: item.id });
      }
      showToast("Лиды куплены", "success");
      clearCart();
      router.push("/leads");
    } catch (error: any) {
      const message = error?.message || "Ошибка покупки";
      showToast(
        message.length > 50 ? message.substring(0, 47) + "..." : message,
        "error"
      );
    }
  };

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-20 pb-safe-bottom"
    >
      <Header title="Корзина" onProfileClick={() => router.push("/profile")} />
      <main className="container-mobile pt-6 pb-6 space-y-4">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {items.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-body text-light-textSecondary dark:text-dark-textSecondary">
                В корзине пока нет лидов
              </div>
            </Card>
          ) : (
            <>
              {items.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  variants={{
                    initial: { opacity: 0, y: 8 },
                    animate: { opacity: 1, y: 0 },
                  }}
                  transition={{
                    duration: 0.24,
                    ease: "easeOut",
                    delay: index * 0.04,
                  }}
                >
                  <Card 
                    className="p-4 cursor-pointer"
                    onClick={() => router.push(`/leads/${lead.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-body font-semibold text-light-text dark:text-dark-text mb-1">
                          {lead.phone}
                        </div>
                        <div className="text-small text-light-textSecondary dark:text-dark-textSecondary mb-1">
                          {lead.region || "Не указан регион"}
                        </div>
                        {lead.comment && (
                          <div className="text-small text-light-textSecondary dark:text-dark-textSecondary line-clamp-2">
                            {lead.comment}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="text-body font-bold text-light-accent dark:text-dark-accent whitespace-nowrap">
                          {lead.price.toLocaleString()} ₽
                        </div>
                        <Button
                          variant="secondary"
                          className="h-8 px-3 text-[11px]"
                          onClick={() => removeItem(lead.id)}
                        >
                          Убрать
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </>
          )}
        </motion.div>

        {items.length > 0 && (
          <div className="sticky bottom-20 left-0 right-0 mt-4 pt-3 border-t border-light-border dark:border-dark-border bg-light-bg/90 dark:bg-dark-bg/90 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="text-small text-light-textSecondary dark:text-dark-textSecondary">
                Итого
              </div>
              <div className="text-h2 font-bold text-light-text dark:text-dark-text">
                {totalPrice.toLocaleString()} ₽
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1 h-11"
                onClick={clearCart}
                disabled={buyLeadMutation.isPending}
              >
                Очистить
              </Button>
              <Button
                className="flex-1 h-11"
                onClick={handleBuyAll}
                disabled={buyLeadMutation.isPending}
              >
                {buyLeadMutation.isPending ? "Покупка..." : "Купить все"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </motion.div>
  );
}


