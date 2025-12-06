"use client";

import { ReactNode } from "react";
import { useTelegramUser } from "@/hooks/useTelegramUser";
import { Card } from "./Card";

interface TelegramAuthProps {
  children: ReactNode;
}

export function TelegramAuth({ children }: TelegramAuthProps) {
  const { userId, isReady } = useTelegramUser();

  // Ждём загрузки Telegram SDK
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg p-4">
        <Card className="p-8 text-center max-w-sm">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
            Загрузка...
          </div>
          <div className="text-sm text-light-textSecondary dark:text-dark-textSecondary">
            Подключение к Telegram
          </div>
        </Card>
      </div>
    );
  }

  // Если нет Telegram userId - показываем ошибку
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg p-4">
        <Card className="p-8 text-center max-w-sm">
          <div className="text-4xl mb-4">📱</div>
          <div className="text-xl font-bold text-light-text dark:text-dark-text mb-3">
            Board Traff
          </div>
          <div className="text-sm text-light-textSecondary dark:text-dark-textSecondary mb-6">
            Это приложение работает только как Mini App в Telegram
          </div>
          <a
            href="https://t.me/board_traff_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0088cc] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#0077b5] transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.538-.194 1.006.128.832.943z"/>
            </svg>
            Открыть в Telegram
          </a>
          <div className="mt-4 text-xs text-light-textSecondary dark:text-dark-textSecondary">
            Откройте бота и нажмите кнопку «Открыть приложение»
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

