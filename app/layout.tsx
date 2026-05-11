import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Property Lens — DMG Photo Evidence",
  description: "Structured photo evidence for routine landscaping work verification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col bg-gray-100">
        <TopNav />
        <div className="flex-1 flex flex-col min-h-0">{children}</div>
      </body>
    </html>
  );
}
