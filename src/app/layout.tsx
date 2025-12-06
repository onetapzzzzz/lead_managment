import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/providers/QueryProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import { CartProvider } from "@/contexts/CartContext";
import { NavigationBar } from "@/components/NavigationBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { KeyboardHandler } from "@/components/KeyboardHandler";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1114" },
  ],
};

export const metadata: Metadata = {
  title: "Lead Exchange",
  description: "Система обмена лидами",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lead Exchange",
  },
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
                <KeyboardHandler />
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
