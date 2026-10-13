import type { Metadata } from "next";
import localFont from "next/font/local";

import '@repo/ui/globals.css'

export const metadata: Metadata = {
  title: "Shop Manager",
  description: "Handles all shop activities, relating to sales, managing inventory and so much more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
