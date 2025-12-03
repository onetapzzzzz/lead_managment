import { z } from "zod";
import {
  userGetSchema,
  balanceUpdateSchema,
  leadUploadSchema,
  leadBuySchema,
  leadsQuerySchema,
} from "./validations";

const API_BASE = "/api";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const ERROR_MESSAGES: Record<number, string> = {
  400: "Неверный запрос",
  401: "Требуется авторизация",
  403: "Доступ запрещён",
  404: "Не найдено",
  409: "Конфликт данных",
  422: "Ошибка валидации",
  500: "Ошибка сервера",
  503: "Сервис недоступен",
};

function getErrorMessage(error: unknown, status: number): string {
  if (error && typeof error === "object" && "error" in error) {
    const message = String(error.error);
    // Ограничиваем длину сообщения для мобильных
    return message.length > 60 ? message.substring(0, 57) + "..." : message;
  }
  return ERROR_MESSAGES[status] || "Произошла ошибка";
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new ApiError(
        getErrorMessage(data, response.status),
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Проверяем, это ошибка сети или парсинга
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError("Нет подключения к интернету", 0, error);
    }
    throw new ApiError("Ошибка сети. Проверьте подключение", 0, error);
  }
}

// User API
export const userApi = {
  get: async (userId?: string) => {
    const params = userId ? `?userId=${userId}` : "";
    return fetchApi<{
      id: string;
      telegramId: string | null;
      username: string | null;
      fullName: string | null;
      balance: number;
      createdAt: string;
    }>(`/user/get${params}`);
  },

  updateBalance: async (data: z.infer<typeof balanceUpdateSchema>) => {
    balanceUpdateSchema.parse(data);
    return fetchApi<{ balance: number }>("/user/balance/update", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Leads API
export const leadsApi = {
  upload: async (data: z.infer<typeof leadUploadSchema>) => {
    leadUploadSchema.parse(data);
    return fetchApi<{
      id: string;
      phone: string;
      comment: string | null;
      region: string | null;
      price: number;
      createdAt: string;
    }>("/leads/upload", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  uploadBatch: async (data: z.infer<typeof import("@/lib/validations").leadBatchUploadSchema>) => {
    const { leadBatchUploadSchema } = await import("@/lib/validations");
    leadBatchUploadSchema.parse(data);
    return fetchApi<{
      batch: {
        id: string;
        totalUploaded: number;
        totalValid: number;
        duplicatesRejected: number;
        pointsCredited: number;
      };
      leads: Array<{
        id: string;
        phone: string;
      }>;
      balance: number;
      message: string;
    }>("/leads/upload-batch", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  my: async (params?: Partial<z.infer<typeof leadsQuerySchema>> & { type?: "uploaded" | "received" | "purchased" }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return fetchApi<{
      leads: Array<{
        id: string;
        phone: string;
        comment?: string | null;
        region: string | null;
        niche?: string | null;
        purchaseCount?: number;
        purchaseStatus?: string;
        isUnique?: boolean;
        isArchived?: boolean;
        ownerReward?: number;
        nextPrice?: number | null;
        pricePaid?: number;
        purchasedAt?: string;
        status?: string;
        createdAt: string;
      }>;
      total: number;
      stats?: {
        totalUploaded?: number;
        totalReward?: number;
        inMarket?: number;
        archived?: number;
        totalPurchased?: number;
        totalSpent?: number;
      };
    }>(`/leads/my${queryString ? `?${queryString}` : ""}`);
  },

  market: async (params?: z.infer<typeof leadsQuerySchema> & { niche?: string; region?: string; userId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return fetchApi<{
      leads: Array<{
        id: string;
        phone: string;
        region: string | null;
        niche: string | null;
        comment: string | null;
        price: number;
        purchaseCount: number;
        purchaseStatus: string;
        isUnique: boolean;
        remaining: number;
        createdAt: string;
      }>;
      total: number;
      userBalance: number;
    }>(`/leads/market${queryString ? `?${queryString}` : ""}`);
  },

  getById: async (leadId: string) => {
    return fetchApi<{
      id: string;
      phone: string;
      comment: string | null;
      region: string | null;
      niche: string | null;
      price: number;
      status: string;
      createdAt: string;
      updatedAt: string;
      owner: {
        id: string;
        username: string | null;
        fullName: string | null;
        telegramId: string | null;
      } | null;
      purchaseCount: number;
    }>(`/leads/${leadId}`);
  },

  buy: async (data: z.infer<typeof leadBuySchema>) => {
    leadBuySchema.parse(data);
    return fetchApi<{
      lead: {
        id: string;
        phone: string;
        comment: string | null;
        region: string | null;
        niche: string | null;
        purchaseCount: number;
        isArchived: boolean;
        createdAt: string;
      };
      price: number;
      balance: number;
    }>("/leads/buy", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Transactions API
export const transactionsApi = {
  list: async (params?: z.infer<typeof leadsQuerySchema>) => {
    let queryParams = "";
    if (params) {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          sp.append(key, String(value));
        }
      });
      queryParams = `?${sp.toString()}`;
    }
    return fetchApi<{
      transactions: Array<{
        id: string;
        amount: number;
        type: string;
        createdAt: string;
        leadId: string | null;
      }>;
      total: number;
    }>(`/transactions/list${queryParams}`);
  },
};
