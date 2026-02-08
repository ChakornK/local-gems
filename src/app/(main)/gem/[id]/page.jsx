"use client";

import { use } from "react";
import LocalGemsMap from "@/components/LocalGemsMap";

export default function GemPage({ params }) {
  const { id } = use(params);
  return <LocalGemsMap initialGemId={id} />;
}
