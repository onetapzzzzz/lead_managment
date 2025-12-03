"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeInUp, fadeInUpTransition } from "@/lib/motion";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  animated?: boolean;
}

export const Card = ({
  children,
  className,
  onClick,
  animated = true,
}: CardProps) => {
  const Component = animated ? motion.div : "div";
  const props = animated
    ? {
        variants: fadeInUp,
        initial: "initial",
        animate: "animate",
        transition: fadeInUpTransition,
      }
    : {};

  return (
    <Component
      {...props}
      className={clsx(
        "bg-light-surface dark:bg-dark-surface rounded-card shadow-soft p-4",
        onClick && "cursor-pointer hover:shadow-soft-lg transition-shadow",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Component>
  );
};





