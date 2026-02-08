// src/app/api/gems/[id]/appraise/route.js
export const dynamic = "force-dynamic";

function getStore() {
  globalThis.__LOCAL_GEMS__ = globalThis.__LOCAL_GEMS__ || [];
  return globalThis.__LOCAL_GEMS__;
}

export async function POST(request, { params }) {
  const { id } = params;
  const gems = getStore();

  const gem = gems.find((g) => g.id === id);
  if (!gem) return new Response("Not found", { status: 404 });

  gem.appraisals = (gem.appraisals || 0) + 1;
  return Response.json({ ok: true, appraisals: gem.appraisals });
}