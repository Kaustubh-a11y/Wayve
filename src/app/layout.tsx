import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wayve — Conversational Agentic Navigation",
  description: "Next-generation spatial navigation powered by conversational agentic intelligence, real-time traffic fusion, and dynamic route optimization.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#f8fafc] text-slate-800 overflow-hidden w-screen h-screen">
        {children}
      </body>
    </html>
  );
}
