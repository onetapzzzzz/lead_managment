import { Variants } from "framer-motion";

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export const fadeInUpTransition = {
  duration: 0.24,
  ease: "easeOut" as const,
};

export const scaleTap = {
  whileTap: { scale: 0.97 },
};

export const modalPop: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const modalPopTransition = {
  duration: 0.2,
  ease: "easeOut" as const,
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const springCounter = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
};

export const pageTransition = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: {
    duration: 0.24,
    ease: "easeOut" as const,
  },
};





