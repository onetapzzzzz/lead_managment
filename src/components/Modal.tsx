"use client";

import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { modalPop, modalPopTransition } from "@/lib/motion";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      
      // Предотвращаем скролл на iOS
      document.documentElement.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ 
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            paddingLeft: "env(safe-area-inset-left, 0px)",
            paddingRight: "env(safe-area-inset-right, 0px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={modalPop}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={modalPopTransition}
            className="relative w-full max-w-md bg-light-surface dark:bg-dark-surface rounded-t-card sm:rounded-card shadow-soft-lg p-4 sm:p-6 z-10 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              WebkitOverflowScrolling: "touch",
            }}
          >
            {title && (
              <h2 className="text-h2 mb-4 text-light-text dark:text-dark-text pr-8 sm:pr-0">
                {title}
              </h2>
            )}
            <div className="mb-4 sm:mb-6">{children}</div>
            {footer && (
              <div className="flex flex-col gap-2 sm:gap-3 sticky bottom-0 bg-light-surface dark:bg-dark-surface pt-2 -mb-4 sm:-mb-6 pb-safe-bottom">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

