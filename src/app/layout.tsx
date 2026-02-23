import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude AI - Assistant",
  description: "AI Assistant powered by Claude on Amazon Bedrock",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}