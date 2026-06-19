import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyCity Assistant",
  description: "Il tuo assistente personale per gestire MyCity",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
