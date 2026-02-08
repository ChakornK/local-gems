import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "Local Gems",
  description: "See what's happening near you",
};

import FullScreenButton from "@/components/FullScreenButton";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-slate-900">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-dvh pb-12">
        <FullScreenButton />
        {children}
      </body>
    </html>
  );
}
