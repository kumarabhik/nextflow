import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NextFlow",
    template: "%s | NextFlow",
  },
  description:
    "A Krea-inspired multimodal workflow builder for Gemini, media processing, and execution history.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
