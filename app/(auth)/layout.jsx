import Link from "next/link";
import { Suspense } from "react";
import { GitPullRequestArrow, HeartHandshake, LayoutDashboard } from "lucide-react";

import { MarketingNavbar } from "@/app/components/marketing/marketing-navbar";
import { mktFontClassName } from "@/app/lib/marketing/fonts";

import { AuthUrlScrubber } from "./auth-url-scrubber";

const HIGHLIGHTS = [
  {
    icon: LayoutDashboard,
    title: "Every project, one view",
    body: "List, board, timeline and calendar over the same plan — phases, milestones and tasks.",
  },
  {
    icon: GitPullRequestArrow,
    title: "Change requests that resolve",
    body: "Client raises it, you assess the impact, approvals route themselves. Nobody wonders whose turn it is.",
  },
  {
    icon: HeartHandshake,
    title: "Retention on rails",
    body: "Touchpoint sequences, health scores and renewal runways running quietly in the background.",
  },
];

export default function AuthLayout({ children }) {
  return (
    <div
      data-surface="marketing"
      className={`${mktFontClassName} flex min-h-svh flex-col bg-white font-mkt-sans text-mkt-navy antialiased`}
    >
      <MarketingNavbar />
      <Suspense fallback={null}>
        <AuthUrlScrubber />
      </Suspense>

      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-mkt-navy p-12 text-white lg:flex">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                "radial-gradient(50rem 35rem at 0% 0%, #1e2875, transparent 55%), radial-gradient(40rem 30rem at 100% 100%, #c5f04233, transparent 50%)",
            }}
          />

          <div className="relative max-w-lg">
            <p className="text-overline font-semibold uppercase tracking-widest text-mkt-lime">
              Meridian
            </p>
            <h2 className="font-mkt-display mt-4 text-4xl leading-tight text-balance">
              The whole client relationship, not just the task list.
            </h2>
            <ul className="mt-10 space-y-6">
              {HIGHLIGHTS.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-mkt-lime/15 text-mkt-lime">
                    <item.icon aria-hidden="true" className="size-4.5" />
                  </span>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-caption text-white/70">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-caption text-white/50">
            © {new Date().getFullYear()} Meridian Studio
          </p>
        </aside>

        <main id="main" className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:py-16">
          <div className="mx-auto w-full max-w-sm">
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2.5 font-mkt-display text-xl text-mkt-navy focus-ring rounded-md lg:hidden"
            >
              Meridian
            </Link>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
