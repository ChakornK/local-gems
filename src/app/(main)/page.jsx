import LocalGemsMap from "@/components/LocalGemsMap";

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const gemId = params.gemId;
  return <LocalGemsMap initialGemId={gemId} />;
}
