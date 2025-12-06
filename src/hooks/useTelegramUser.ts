"use client";

import { useEffect, useState } from "react";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramWebApp {
  initDataUnsafe?: {
    user?: TelegramUser;
    start_param?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function useTelegramUser() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Даём время для загрузки Telegram SDK
    const checkTelegram = () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
          setUser(tgUser);
        }
        setIsReady(true);
      }
    };

    // Проверяем сразу
    checkTelegram();

    // И через небольшую задержку (для случаев медленной загрузки)
    const timeout = setTimeout(checkTelegram, 500);

    return () => clearTimeout(timeout);
  }, []);

  return {
    user,
    isReady,
    userId: user?.id ? String(user.id) : null,
    username: user?.username,
    fullName: [user?.first_name, user?.last_name].filter(Boolean).join(" ") || null,
  };
}

