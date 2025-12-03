/**
 * Система ценообразования лидов (Degressive Pricing)
 * 
 * Логика:
 * - Лид может быть куплен максимум 3 раза
 * - 1-й покупатель платит 1 поинт
 * - 2-й покупатель платит 0.7 поинта
 * - 3-й покупатель платит 0.3 поинта
 * - Владелец получает до 2 поинтов за лид (1 + 0.7 + 0.3 = 2)
 * - После 3-х покупок лид уходит в архив
 */

export const LEAD_PRICES = [1.0, 0.7, 0.3] as const;
export const MAX_PURCHASES = 3;

/**
 * Получить цену для следующей покупки
 * @param purchaseCount - сколько раз уже купили (0, 1, 2)
 * @returns цена в поинтах или null если лид уже в архиве
 */
export function getLeadPrice(purchaseCount: number): number | null {
  if (purchaseCount >= MAX_PURCHASES) {
    return null; // Лид в архиве
  }
  return LEAD_PRICES[purchaseCount];
}

/**
 * Проверить, доступен ли лид для покупки
 */
export function isLeadAvailable(purchaseCount: number): boolean {
  return purchaseCount < MAX_PURCHASES;
}

/**
 * Получить максимальный доход владельца за лид
 */
export function getMaxOwnerReward(): number {
  return LEAD_PRICES.reduce((sum, price) => sum + price, 0); // 1 + 0.7 + 0.3 = 2
}

/**
 * Форматирование цены для отображения
 */
export function formatPrice(price: number): string {
  if (price === Math.floor(price)) {
    return price.toString();
  }
  return price.toFixed(1);
}

/**
 * Получить статус покупок для UI (например: "1 из 3", "Уникальный")
 */
export function getPurchaseStatus(purchaseCount: number): {
  label: string;
  isUnique: boolean;
  remaining: number;
} {
  const remaining = MAX_PURCHASES - purchaseCount;
  
  if (purchaseCount === 0) {
    return {
      label: "Уникальный",
      isUnique: true,
      remaining,
    };
  }
  
  return {
    label: `${purchaseCount} из ${MAX_PURCHASES}`,
    isUnique: false,
    remaining,
  };
}

/**
 * Получить цвет бейджа для UI
 */
export function getPurchaseBadgeColor(purchaseCount: number): string {
  if (purchaseCount === 0) return "green";  // Уникальный
  if (purchaseCount === 1) return "yellow"; // 1 из 3
  if (purchaseCount === 2) return "orange"; // 2 из 3
  return "red"; // Архив
}



