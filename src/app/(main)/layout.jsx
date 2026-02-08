import "../globals.css";
import "leaflet/dist/leaflet.css";
import { GeolocationProvider } from "@/context/GeolocationContext";

export const metadata = {
  title: "Local Gems",
  description: "See what's happening near you",
};

import BottomNav from "@/components/layout/BottomNav";

export default function RootLayout({ children, modal }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-dvh pb-12">
        <GeolocationProvider>
          {children}
          {modal}
          <BottomNav />
        </GeolocationProvider>
      </body>
    </html>
  );
}
