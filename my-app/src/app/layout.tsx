import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SQL Server Connect WOFF App",
  description: "SQLサーバー接続WOFF アプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script 
          charSet="utf-8" 
          src="https://static.worksmobile.net/static/wm/woff/edge/3.6.2/sdk.js"
        />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-blue-600 text-white p-3">
            <h1 className="text-lg font-bold">SQL Server Connect</h1>
          </header>
          <main className="flex-grow">{children}</main>
        </div>
      </body>
    </html>
  );
}
