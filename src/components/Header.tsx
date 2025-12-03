"use client";

import { motion } from "framer-motion";
import { fadeInUp, fadeInUpTransition } from "@/lib/motion";

interface HeaderProps {
  title?: string;
  onProfileClick?: () => void;
}

export const Header = ({ title = "Leads", onProfileClick }: HeaderProps) => {
  return (
    <motion.header
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={fadeInUpTransition}
      className="sticky top-0 z-40 bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-light-border dark:border-dark-border pt-safe-top"
    >
      <div className="container-mobile h-14 flex items-center justify-between">
        {title && (
          <h1 className="text-h1 font-bold text-light-text dark:text-dark-text">
            {title}
          </h1>
        )}
        {!title && <div />}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onProfileClick}
          className="tap-target rounded-full bg-light-surface dark:bg-dark-surface p-2 shadow-soft hover:shadow-soft-lg transition-shadow"
          aria-label="Профиль"
        >
          <svg
            className="w-6 h-6 text-light-text dark:text-dark-text"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </motion.button>
      </div>
    </motion.header>
  );
};


