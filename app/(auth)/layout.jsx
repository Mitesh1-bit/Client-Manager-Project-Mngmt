import Link from "next/link";
import { GitPullRequestArrow, HeartHandshake, LayoutDashboard } from "lucide-react";

import { BrandMark } from "@/app/components/domain/brand-mark";

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
    <div className="grid min-h-svh grow lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(60rem 40rem at 10% -10%, var(--brand-600), transparent 60%), radial-gradient(45rem 35rem at 110% 110%, var(--brand-700), transparent 55%)",
          }}
        />
        <Link href="/login" className="relative flex items-center gap-3 focus-ring rounded-md">
          <BrandMark size="lg" className="bg-white/15 text-white backdrop-blur" />
          <span className="text-subheading font-semibold tracking-tight">Meridian</span>
        </Link>

        <div className="relative max-w-lg">
          <h2 className="text-display text-balance">
            The whole client relationship, not just the task list.
          </h2>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/12 backdrop-blur">
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

      <main id="main" className="flex flex-col justify-center px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/login"
            className="mb-10 inline-flex items-center gap-2.5 focus-ring rounded-md lg:hidden"
          >
            <BrandMark />
            <span className="font-semibold tracking-tight">Meridian</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
