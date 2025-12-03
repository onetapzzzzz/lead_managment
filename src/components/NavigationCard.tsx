"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card } from "./Card";
import { fadeInUp } from "@/lib/motion";

interface NavigationCardProps {
  icon: ReactNode;
  title: string;
  onClick: () => void;
  delay?: number;
}

export const NavigationCard = ({
  icon,
  title,
  onClick,
  delay = 0,
}: NavigationCardProps) => {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.24, ease: "easeOut", delay }}
    >
      <Card
        onClick={onClick}
        className="p-6 flex flex-col items-center justify-center gap-3 min-h-[120px] cursor-pointer"
      >
        <div className="text-light-accent dark:text-dark-accent">{icon}</div>
        <h3 className="text-body font-semibold text-light-text dark:text-dark-text">
          {title}
        </h3>
      </Card>
    </motion.div>
  );
};





