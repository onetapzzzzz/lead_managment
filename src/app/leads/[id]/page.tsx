"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useBuyLead } from "@/hooks/useLeads";
import { useLead } from "@/hooks/useLead";
import { useToast } from "@/contexts/ToastContext";
import { useCart } from "@/contexts/CartContext";
import { useUser } from "@/hooks/useUser";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { addItem } = useCart();
  const { data: user } = useUser();
  
  // Обработка асинхронных params для Next.js 15
  const resolvedParams = use(params);
  const leadId = resolvedParams.id;
  
  const { data: lead, isLoading } = useLead(leadId);
  const buyLeadMutation = useBuyLead();

  const handleBuyLead = async () => {
    if (!lead) return;
    try {
      await buyLeadMutation.mutateAsync({ leadId: lead.id });
      showToast("Лид куплен", "success");
      router.back();
    } catch (error: any) {
      const message = error?.message || "Ошибка покупки";
      showToast(
        message.length > 50 ? message.substring(0, 47) + "..." : message,
        "error"
      );
    }
  };

  const handleAddToCart = () => {
    if (!lead) return;
    addItem({
      id: lead.id,
      phone: lead.phone,
      comment: lead.comment,
      region: lead.region,
      price: lead.price,
      createdAt: lead.createdAt,
    } as any);
    showToast("Лид добавлен в корзину", "success");
  };

  const getUniquenessText = () => {
    if (!lead) return "";
    if (lead.purchaseCount === 0) return "Уникальный";
    if (lead.purchaseCount === 1) return "1 из 3";
    if (lead.purchaseCount === 2) return "2 из 3";
    return "3 из 3";
  };

  const getLeadState = () => {
    if (!lead) return "Новый";
    // Если лид был куплен хотя бы раз, это вторичка
    return lead.purchaseCount > 0 ? "Вторичка" : "Новый";
  };

  if (isLoading) {
    return (
      <motion.div
        {...pageTransition}
        className="min-h-screen pb-20 pb-safe-bottom"
      >
        <Header />
        <main className="container-mobile pt-6 pb-6">
          <Card className="p-8 text-center">
            <div className="text-body text-light-textSecondary dark:text-dark-textSecondary">
              Загрузка...
            </div>
          </Card>
        </main>
      </motion.div>
    );
  }

  if (!lead) {
    return (
      <motion.div
        {...pageTransition}
        className="min-h-screen pb-20 pb-safe-bottom"
      >
        <Header />
        <main className="container-mobile pt-6 pb-6">
          <Card className="p-8 text-center">
            <div className="text-body text-light-textSecondary dark:text-dark-textSecondary">
              Лид не найден
            </div>
            <Button
              onClick={() => router.back()}
              className="mt-4"
              variant="secondary"
            >
              Назад
            </Button>
          </Card>
        </main>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pb-20 pb-safe-bottom"
    >
      <Header title="" />
      <main className="container-mobile pt-6 pb-6 space-y-4">
        {/* Информация о продавце */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-light-accent/15 dark:bg-dark-accent/20 flex items-center justify-center text-h2 font-semibold text-light-accent dark:text-dark-accent">
              {lead.owner?.fullName?.[0] || lead.owner?.username?.[0] || "Л"}
            </div>
            <div className="flex-1">
              <div className="text-body font-semibold text-light-text dark:text-dark-text mb-1">
                {lead.owner?.fullName || lead.owner?.username || "Продавец лида"}
              </div>
              <div className="flex items-center gap-2 text-small text-light-textSecondary dark:text-dark-textSecondary">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span>4.8</span>
                </span>
                <span>•</span>
                <span>12 отзывов</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Гео и состояние */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="text-small text-light-textSecondary dark:text-dark-textSecondary mb-1">
              Гео
            </div>
            <div className="text-body font-semibold text-light-text dark:text-dark-text">
              {lead.region || "Не указано"}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-small text-light-textSecondary dark:text-dark-textSecondary mb-1">
              Состояние
            </div>
            <div className="text-body font-semibold text-light-text dark:text-dark-text">
              {getLeadState()}
            </div>
          </Card>
        </div>

        {/* Уникальность */}
        <Card className="p-4">
          <div className="text-small text-light-textSecondary dark:text-dark-textSecondary mb-1">
            Уникальность
          </div>
          <div className="flex flex-wrap gap-2">
            {["Уникальный", "0 из 3", "1 из 3", "2 из 3"].map((opt) => {
              const isActive = opt === getUniquenessText();
              return (
                <span
                  key={opt}
                  className={`px-3 py-1 rounded-full text-[11px] border ${
                    isActive
                      ? "bg-light-accent dark:bg-dark-accent text-white border-transparent"
                      : "border-light-border dark:border-dark-border text-light-textSecondary dark:text-dark-textSecondary"
                  }`}
                >
                  {opt}
                </span>
              );
            })}
          </div>
        </Card>

        {/* Комментарий по лиду */}
        {lead.comment && (
          <Card className="p-4">
            <div className="text-small text-light-textSecondary dark:text-dark-textSecondary mb-2">
              Комментарий по лиду
            </div>
            <div className="text-body text-light-text dark:text-dark-text">
              {lead.comment}
            </div>
          </Card>
        )}

        {/* Кнопка покупки */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-light-bg dark:bg-dark-bg border-t border-light-border dark:border-dark-border pb-safe-bottom pt-4 px-4">
          <div className="container-mobile">
            <div className="flex gap-3 mb-4">
              <Button
                variant="secondary"
                className="flex-1 h-12"
                onClick={() => router.back()}
              >
                Назад
              </Button>
              <div className="flex-1 flex flex-col">
                <Button
                  className="h-12 w-full"
                  disabled={buyLeadMutation.isPending}
                  onClick={handleBuyLead}
                >
                  {buyLeadMutation.isPending ? "..." : "Купить"}
                </Button>
                <div className="flex items-center justify-center gap-2 mt-1 text-small text-light-textSecondary dark:text-dark-textSecondary">
                  <span>{lead.price.toLocaleString()} ₽</span>
                  <span>•</span>
                  <span>{lead.price} LC</span>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full h-10 text-small"
              onClick={handleAddToCart}
            >
              Добавить в корзину
            </Button>
          </div>
        </div>
      </main>
    </motion.div>
  );
}

