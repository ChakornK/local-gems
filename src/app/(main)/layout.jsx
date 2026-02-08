import { GeolocationProvider } from "@/context/GeolocationContext";

import BottomNav from "@/components/layout/BottomNav";

export default function MainLayout({ children, modal }) {
  return (
    <GeolocationProvider>
      {children}
      {modal}
      <BottomNav />
    </GeolocationProvider>
  );
}
