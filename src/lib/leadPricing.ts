/**
 * Система ценообразования лидов (Degressive Pricing)
 * 
 * Логика:
 * - Лид может быть куплен максимум 3 раза
 * - Уникальный (0 из 3) - 2 LC
 * - 1 из 3 - 1 LC
 * - 2 из 3 - 0.5 LC
 * - Владелец получает до 3.5 LC за лид (2 + 1 + 0.5 = 3.5)
 * - После 3-х покупок лид уходит в архив
 */

export const LEAD_PRICES = [2.0, 1.0, 0.5] as const;
export const MAX_PURCHASES = 3;

/**
 * Получить цену для следующей покупки
 * @param purchaseCount - сколько раз уже купили (0, 1, 2)
 * @returns цена в LC или null если лид уже в архиве
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
  return LEAD_PRICES.reduce((sum, price) => sum + price, 0); // 2 + 1 + 0.5 = 3.5
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
 * Получить статус покупок для UI
 * Уникальный = 0 из 3
 * После покупок: 1 из 3, 2 из 3
 */
export function getPurchaseStatus(purchaseCount: number): {
  label: string;
  isUnique: boolean;
  remaining: number;
} {
  const remaining = MAX_PURCHASES - purchaseCount;
  
  if (purchaseCount === 0) {
    return {
      label: "0 из 3",
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
