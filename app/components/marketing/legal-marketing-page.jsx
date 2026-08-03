import Link from "next/link";
import { FileText, Shield } from "lucide-react";

import { MarketingBreadcrumb } from "@/app/components/marketing/marketing-page-shell";
import { LEGAL_LAST_UPDATED } from "@/app/lib/marketing/legal-content";
import { cn } from "@/app/lib/utils";

/**
 * @param {{
 *   document: import("@/app/lib/marketing/legal-content").privacyPolicyDocument | import("@/app/lib/marketing/legal-content").termsOfServiceDocument,
 *   breadcrumbItems: { href: string, label: string }[],
 *   tone?: "sky" | "lime",
 *   related?: { href: string, label: string, description: string } | null,
 * }} props
 */
export function LegalDocumentPage({ document, breadcrumbItems, tone = "sky", related = null }) {
  const accent =
    tone === "lime"
      ? {
          badge: "bg-mkt-lime/25 text-mkt-navy",
          ring: "ring-mkt-lime/40",
          link: "text-mkt-navy hover:text-mkt-cta",
          dot: "bg-mkt-lime",
        }
      : {
          badge: "bg-mkt-sky/25 text-mkt-navy",
          ring: "ring-mkt-sky/40",
          link: "text-mkt-navy hover:text-mkt-cta",
          dot: "bg-mkt-sky",
        };

  return (
    <>
      <header className="relative overflow-hidden border-b border-mkt-navy/10 bg-[#f7f8fc]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 size-72 rounded-full bg-mkt-lime/12 blur-[90px]" />
          <div className="absolute -right-16 top-8 size-80 rounded-full bg-mkt-sky/14 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(10,21,80,0.06) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16 lg:py-20">
          <nav aria-label="Breadcrumb" className="text-sm text-mkt-navy/55">
            <MarketingBreadcrumb items={breadcrumbItems} />
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em]",
                accent.badge,
              )}
            >
              <span className={cn("size-1.5 rounded-full", accent.dot)} aria-hidden />
              Legal
            </span>
            <time dateTime={LEGAL_LAST_UPDATED} className="text-sm text-mkt-navy/50">
              Last updated {formatLegalDate(LEGAL_LAST_UPDATED)}
            </time>
          </div>

          <h1 className="mt-5 max-w-4xl font-mkt-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.08] tracking-tight text-mkt-navy">
            {document.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-mkt-navy/70">{document.description}</p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-14">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="On this page" className={cn("rounded-2xl border border-mkt-navy/10 bg-white p-5 shadow-sm ring-1", accent.ring)}>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-mkt-navy/45">On this page</p>
              <ol className="mt-4 space-y-1">
                {document.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={cn(
                        "block rounded-lg px-2.5 py-1.5 text-sm font-medium text-mkt-navy/70 transition hover:bg-mkt-navy/[0.04] hover:text-mkt-navy",
                      )}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {related ? (
              <div className="mt-4 rounded-2xl border border-mkt-navy/10 bg-white p-5 shadow-sm">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-mkt-navy/45">Related</p>
                <Link href={related.href} className="mt-3 block group">
                  <span className="font-mkt-display text-lg text-mkt-navy group-hover:text-mkt-cta">{related.label}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-mkt-navy/60">{related.description}</span>
                </Link>
              </div>
            ) : null}
          </aside>

          <article className="min-w-0">
            <aside className="rounded-2xl border border-mkt-sun/50 bg-mkt-sun/20 p-5 md:p-6">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-mkt-navy/55">At a glance</p>
              <p className="mt-2 text-base font-medium leading-relaxed text-mkt-navy">{document.summary}</p>
            </aside>

            <div className="prose-marketing mt-10">
              {document.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28 border-b border-mkt-navy/8 pb-10 last:border-b-0">
                  <h2 className="!mt-0">{section.title}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                  {section.list?.length ? (
                    <ul className="my-4 list-disc space-y-2 pl-5 marker:text-mkt-cta">
                      {section.list.map((item) => (
                        <li key={item.slice(0, 48)}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>

            <footer className="mt-12 rounded-2xl border border-mkt-navy/10 bg-[#faf9f6] p-6 md:p-8">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-mkt-navy/45">Related documents</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <LegalRelatedCard
                  href="/privacy"
                  icon={Shield}
                  title="Privacy policy"
                  description="How Meridian handles personal and client data."
                  active={document.path === "/privacy"}
                />
                <LegalRelatedCard
                  href="/terms"
                  icon={FileText}
                  title="Terms of service"
                  description="Rules for using Meridian and the client portal."
                  active={document.path === "/terms"}
                />
              </div>
              <p className="mt-6 text-sm text-mkt-navy/60">
                Questions about your workspace?{" "}
                <Link href="/login" className="font-semibold text-mkt-cta hover:underline">
                  Sign in
                </Link>{" "}
                or{" "}
                <Link href="/signup" className="font-semibold text-mkt-cta hover:underline">
                  create an account
                </Link>
                . Return to the{" "}
                <Link href="/" className="font-semibold text-mkt-cta hover:underline">
                  Meridian homepage
                </Link>
                .
              </p>
            </footer>
          </article>
        </div>
      </div>
    </>
  );
}

function LegalRelatedCard({ href, icon: Icon, title, description, active }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex gap-3 rounded-xl border p-4 transition",
        active
          ? "border-mkt-navy/20 bg-white shadow-sm"
          : "border-mkt-navy/10 bg-white/80 hover:border-mkt-navy/20 hover:shadow-sm",
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-mkt-navy/[0.06] text-mkt-navy">
        <Icon aria-hidden className="size-5" />
      </span>
      <span>
        <span className="font-mkt-display text-lg text-mkt-navy group-hover:text-mkt-cta">{title}</span>
        <span className="mt-0.5 block text-sm text-mkt-navy/60">{description}</span>
      </span>
    </Link>
  );
}

function formatLegalDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
