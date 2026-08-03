import { llmsFullTxtContent } from "@/app/lib/marketing/seo";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  return new Response(llmsFullTxtContent(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
