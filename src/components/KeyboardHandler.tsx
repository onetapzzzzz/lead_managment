"use client";

import { useEffect } from "react";

/**
 * Компонент для обработки виртуальной клавиатуры на мобильных устройствах.
 * Отслеживает изменения visualViewport и обновляет CSS переменные.
 */
export function KeyboardHandler() {
  useEffect(() => {
    // Проверяем поддержку visualViewport API
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    const viewport = window.visualViewport;

    const updateViewportHeight = () => {
      // Высота видимой области
      const visualHeight = viewport.height;
      // Полная высота окна
      const windowHeight = window.innerHeight;
      // Высота клавиатуры (разница)
      const keyboardHeight = Math.max(0, windowHeight - visualHeight);

      // Обновляем CSS переменные
      document.documentElement.style.setProperty(
        "--visual-viewport-height",
        `${visualHeight}px`
      );
      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${keyboardHeight}px`
      );

      // Если клавиатура открыта, прокручиваем к активному элементу
      if (keyboardHeight > 0 && document.activeElement) {
        const activeElement = document.activeElement as HTMLElement;
        if (
          activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT"
        ) {
          // Небольшая задержка для iOS
          setTimeout(() => {
            activeElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        }
      }
    };

    // Начальная установка
    updateViewportHeight();

    // Подписываемся на события
    viewport.addEventListener("resize", updateViewportHeight);
    viewport.addEventListener("scroll", updateViewportHeight);

    // Дополнительно отслеживаем focus/blur на инпутах
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        // Задержка для появления клавиатуры
        setTimeout(updateViewportHeight, 300);
      }
    };

    const handleBlur = () => {
      // Задержка для скрытия клавиатуры
      setTimeout(() => {
        document.documentElement.style.setProperty("--keyboard-height", "0px");
        document.documentElement.style.setProperty(
          "--visual-viewport-height",
          `${window.innerHeight}px`
        );
      }, 100);
    };

    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);

    return () => {
      viewport.removeEventListener("resize", updateViewportHeight);
      viewport.removeEventListener("scroll", updateViewportHeight);
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, []);

  return null;
}

