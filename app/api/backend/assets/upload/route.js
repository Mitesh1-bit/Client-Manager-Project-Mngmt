import { NextResponse } from "next/server";

/**
 * Same-origin upload proxy. `requestUploadUrl` hands back an absolute backend
 * URL (e.g. http://127.0.0.1:8000/assets/upload) — that's fine from the same
 * machine the backend runs on, but wrong from any other device on the LAN,
 * since 127.0.0.1 there means "that other device," not this host. The upload
 * token already encodes which file this write is for, so this route ignores
 * whatever host the browser was given and always forwards to the backend
 * this Next.js server itself talks to.
 */
export const runtime = "nodejs";

const BACKEND_BASE_URL =
  (process.env.BACKEND_GRAPHQL_URL || "http://127.0.0.1:8000/graphql").replace(/\/graphql$/, "");

export async function PUT(request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ detail: "Upload token required" }, { status: 401 });
  }

  const upstream = await fetch(`${BACKEND_BASE_URL}/assets/upload`, {
    method: "PUT",
    headers: { authorization },
    body: request.body,
    duplex: "half",
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
  });
}
