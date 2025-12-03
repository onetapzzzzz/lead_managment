"use client";

import { useEffect, useState } from "react";
import { applyTheme, watchTheme } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);

  useEffect(() => {
    applyTheme();
    const unwatch = watchTheme();
    return unwatch;
  }, []);

  // Полная интеграция с Telegram WebApp API
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = (window as any).Telegram?.WebApp;
    if (!tg) {
      // Не в Telegram WebApp - обычный браузер
      return;
    }

    setIsTelegramWebApp(true);

    // Инициализация Telegram WebApp
    tg.ready();
    tg.expand();

    // Применяем тему из Telegram
    if (tg.colorScheme) {
      const root = document.documentElement;
      if (tg.colorScheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    // Применяем цвета из themeParams
    if (tg.themeParams) {
      const params = tg.themeParams;
      const root = document.documentElement;
      
      if (params.bg_color) {
        root.style.setProperty("--tg-theme-bg-color", params.bg_color);
      }
      if (params.text_color) {
        root.style.setProperty("--tg-theme-text-color", params.text_color);
      }
      if (params.hint_color) {
        root.style.setProperty("--tg-theme-hint-color", params.hint_color);
      }
      if (params.link_color) {
        root.style.setProperty("--tg-theme-link-color", params.link_color);
      }
      if (params.button_color) {
        root.style.setProperty("--tg-theme-button-color", params.button_color);
      }
      if (params.button_text_color) {
        root.style.setProperty("--tg-theme-button-text-color", params.button_text_color);
      }
      if (params.secondary_bg_color) {
        root.style.setProperty("--tg-theme-secondary-bg-color", params.secondary_bg_color);
      }
    }

    // Устанавливаем цвет фона и header
    if (tg.backgroundColor) {
      document.body.style.backgroundColor = tg.backgroundColor;
    }
    if (tg.headerColor) {
      // Можно использовать для кастомного header
    }

    // Обработка кнопки "Назад"
    if (tg.BackButton?.isVisible) {
      tg.BackButton.onClick(() => {
        // Можно использовать router.back() или другую логику
        if (window.history.length > 1) {
          window.history.back();
        } else {
          tg.close();
        }
      });
    }

    // Получаем initData и отправляем на сервер для авторизации
    const initData = tg.initData;
    if (initData) {
      fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      }).catch((error) => {
        console.error("Error authenticating with Telegram:", error);
      });
    }

    // Обработка событий изменения темы
    tg.onEvent("themeChanged", () => {
      if (tg.colorScheme) {
        const root = document.documentElement;
        if (tg.colorScheme === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    });

    // Обработка изменения viewport
    tg.onEvent("viewportChanged", () => {
      // Можно обновить UI при изменении размера окна
      console.log("Viewport changed:", tg.viewportHeight);
    });

    return () => {
      // Cleanup при размонтировании
      if (tg.BackButton) {
        tg.BackButton.offClick(() => {});
      }
      tg.offEvent("themeChanged", () => {});
      tg.offEvent("viewportChanged", () => {});
    };
  }, []);

  return <>{children}</>;
}

