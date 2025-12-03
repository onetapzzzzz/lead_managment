import { createHmac } from "crypto";

/**
 * Верификация initData от Telegram WebApp
 */
export function verifyTelegramWebAppData(
  initData: string,
  botToken: string
): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    urlParams.delete("hash");

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const calculatedHash = createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    return calculatedHash === hash;
  } catch (error) {
    console.error("Error verifying Telegram data:", error);
    return false;
  }
}

export function parseInitData(initData: string): {
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  auth_date?: number;
  hash?: string;
} {
  const params = new URLSearchParams(initData);
  const userStr = params.get("user");
  
  return {
    user: userStr ? JSON.parse(userStr) : undefined,
    auth_date: params.get("auth_date")
      ? parseInt(params.get("auth_date")!)
      : undefined,
    hash: params.get("hash") || undefined,
  };
}

