export function maskPhone(phone: string): string {
  if (phone.length < 10) return phone;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("7")) {
    return `+7 ${cleaned.slice(1, 4)} *** ** ${cleaned.slice(-2)}`;
  }
  return phone;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
