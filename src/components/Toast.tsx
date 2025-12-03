"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast = ({
  message,
  type = "info",
  isVisible,
  onClose,
  duration = 4000,
}: ToastProps) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const isShortMessage = message.length < 30;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed z-[100] pointer-events-none"
          style={{
            top: "max(env(safe-area-inset-top, 0px) + 3rem, 3rem)",
            left: "1rem",
            right: "1rem",
            width: "calc(100% - 2rem)",
            maxWidth: "20rem",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <div
            className={`rounded-lg sm:rounded-card shadow-soft-lg ${
              isShortMessage ? "py-2 px-3" : "py-2.5 px-3 sm:p-3"
            } flex items-center gap-2 pointer-events-auto ${
              type === "success"
                ? "bg-light-success dark:bg-dark-success text-white"
                : type === "error"
                ? "bg-light-error dark:bg-dark-error text-white"
                : "bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border border-light-border dark:border-dark-border"
            }`}
          >
            <p className={`${isShortMessage ? "text-[13px] sm:text-small" : "text-small sm:text-body"} flex-1 leading-tight break-words`}>
              {message}
            </p>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-full p-0.5 sm:p-1 hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/20 dark:active:bg-white/20 transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center"
              aria-label="Закрыть"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

