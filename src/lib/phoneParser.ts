/**
 * Парсер телефонов из текста
 * Нормализует в формат +7XXXXXXXXXX
 */

export interface ParsedPhone {
  original: string;
  normalized: string;
}

const PHONE_PATTERNS = [
  // +7XXXXXXXXXX
  /\+7(\d{10})/g,
  // 8XXXXXXXXXX
  /8(\d{10})/g,
  // 7XXXXXXXXXX (без плюса)
  /\b7(\d{10})\b/g,
  // (XXX) XXX-XX-XX
  /\((\d{3})\)\s*(\d{3})-(\d{2})-(\d{2})/g,
  // XXX-XXX-XX-XX
  /(\d{3})-(\d{3})-(\d{2})-(\d{2})/g,
  // XXXXXXXXXX (10 цифр подряд)
  /\b(\d{10})\b/g,
];

export function parsePhonesFromText(text: string): ParsedPhone[] {
  const phones: Map<string, ParsedPhone> = new Map();

  for (const pattern of PHONE_PATTERNS) {
    const matches = text.matchAll(pattern);
    
    for (const match of matches) {
      let digits = "";
      
      if (match[0].startsWith("+7") || match[0].startsWith("8") || match[0].startsWith("7")) {
        // Уже есть код страны
        digits = match[0].replace(/\D/g, "");
        if (digits.startsWith("8")) {
          digits = "7" + digits.substring(1);
        }
        if (!digits.startsWith("7")) {
          digits = "7" + digits;
        }
      } else {
        // Только цифры, добавляем 7
        digits = "7" + match.slice(1).join("").replace(/\D/g, "");
      }

      // Проверяем, что получилось 11 цифр (7 + 10)
      if (digits.length === 11 && digits.startsWith("7")) {
        const normalized = "+" + digits;
        if (!phones.has(normalized)) {
          phones.set(normalized, {
            original: match[0],
            normalized,
          });
        }
      }
    }
  }

  return Array.from(phones.values());
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length === 11) {
    if (cleaned.startsWith("8")) {
      return "+7" + cleaned.substring(1);
    }
    if (cleaned.startsWith("7")) {
      return "+" + cleaned;
    }
  }
  
  if (cleaned.length === 10) {
    return "+7" + cleaned;
  }
  
  return phone;
}

export function validatePhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+7\d{10}$/.test(normalized);
}





