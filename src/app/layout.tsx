import type { Metadata } from "next";
import { QueryProvider } from "@/providers/QueryProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import { CartProvider } from "@/contexts/CartContext";
import { NavigationBar } from "@/components/NavigationBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leads App",
  description: "Система управления лидами",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>
              <CartProvider>
                {children}
                <NavigationBar />
              </CartProvider>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
