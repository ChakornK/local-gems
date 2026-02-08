"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import BottomSheet from "@/components/BottomSheet";
import GemDetails from "@/components/GemDetails";

export default function GemModal({ params }) {
  const router = useRouter();
  const { id } = use(params);

  return (
    <BottomSheet open={true} onClose={() => router.back()}>
      <GemDetails gemId={id} onClose={() => router.back()} />
    </BottomSheet>
  );
}
