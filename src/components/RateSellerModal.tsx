"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";
import { Card } from "./Card";
import { useToast } from "@/contexts/ToastContext";
import { useMutation } from "@tanstack/react-query";

interface RateSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  leadId?: string;
  buyerId: string;
  sellerName?: string;
}

export function RateSellerModal({
  isOpen,
  onClose,
  sellerId,
  leadId,
  buyerId,
  sellerName,
}: RateSellerModalProps) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitReview = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          buyerId,
          rating,
          comment: comment.trim() || undefined,
          leadId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка отправки отзыва");
      }

      return response.json();
    },
    onSuccess: () => {
      showToast("Спасибо за отзыв!", "success");
      onClose();
      setRating(5);
      setComment("");
    },
    onError: (error: any) => {
      showToast(error.message || "Ошибка отправки", "error");
    },
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-light-text dark:text-dark-text mb-4 text-center">
              Оцените продавца
            </h2>
            
            {sellerName && (
              <p className="text-sm text-light-textSecondary dark:text-dark-textSecondary text-center mb-4">
                {sellerName}
              </p>
            )}

            {/* Звёзды */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    star <= rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>

            {/* Комментарий */}
            <div className="mb-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий (необязательно)"
                className="w-full min-h-[80px] rounded-xl border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-3 text-sm focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors resize-none"
              />
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1 py-3"
              >
                Пропустить
              </Button>
              <Button
                onClick={() => submitReview.mutate()}
                disabled={submitReview.isPending}
                className="flex-1 py-3"
              >
                {submitReview.isPending ? "..." : "Отправить"}
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

