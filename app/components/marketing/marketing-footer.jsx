import Link from "next/link";

import { LOGIN_URL, SIGNUP_URL, SITE_NAME } from "@/app/lib/marketing/site";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/product", label: "Overview" },
      { href: "/product#companies", label: "Companies & contacts" },
      { href: "/product#projects", label: "Projects & delivery" },
      { href: "/product#change-requests", label: "Change requests" },
      { href: "/product#portal", label: "Client portal" },
      { href: "/product#retention", label: "Retention & health" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { href: "/solutions", label: "Overview" },
      { href: "/solutions#account-managers", label: "Account managers" },
      { href: "/solutions#project-managers", label: "Project managers" },
      { href: "/solutions#leadership", label: "Agency leadership" },
      { href: "/solutions#clients", label: "Client partners" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Guides" },
      { href: SIGNUP_URL, label: "Create account" },
      { href: LOGIN_URL, label: "Sign in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-mkt-navy/10 bg-mkt-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-5 md:px-6">
        <div className="lg:col-span-1">
          <Link href="/" className="font-mkt-display text-2xl hover:text-mkt-sun">
            {SITE_NAME}
          </Link>
          <p className="mt-3 text-sm text-white/70">
            Client & project management for agencies — companies, projects, change requests, portal,
            and retention in one app.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href={LOGIN_URL} className="text-sm font-semibold text-mkt-sun hover:underline">
              Sign in to app →
            </Link>
            <Link href={SIGNUP_URL} className="text-sm font-semibold text-white/80 hover:text-mkt-sun hover:underline">
              Create account →
            </Link>
          </div>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/60">{column.title}</h2>
            <ul className="mt-4 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/90 hover:text-mkt-sun">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/65 md:px-6">
        © {new Date().getFullYear()} {SITE_NAME}
      </div>
    </footer>
  );
}
