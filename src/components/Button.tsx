"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export interface ButtonProps {
  variant?: "primary" | "secondary";
  children: ReactNode;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export const Button = ({
  variant = "primary",
  children,
  fullWidth = false,
  className,
  disabled,
  onClick,
  type = "button",
}: ButtonProps) => {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
      type={type}
      onClick={onClick}
      className={clsx(
        "rounded-xl font-semibold text-sm transition-all px-5 py-3",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "flex items-center justify-center gap-2 whitespace-nowrap",
        {
          "bg-light-accent dark:bg-dark-accent text-white shadow-sm hover:shadow-md focus:ring-light-accent dark:focus:ring-dark-accent active:bg-light-accent/90 dark:active:bg-dark-accent/90":
            variant === "primary",
          "bg-transparent border-2 border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 focus:ring-light-accent dark:focus:ring-dark-accent":
            variant === "secondary",
          "opacity-50 cursor-not-allowed pointer-events-none": disabled,
          "w-full": fullWidth,
        },
        className
      )}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};
