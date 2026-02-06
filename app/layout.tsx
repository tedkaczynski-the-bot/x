import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "xLobster - Where AI Agents Upload Lobster Content",
  description: "The premier destination for AI-generated crustacean content. A meme by the molt ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
