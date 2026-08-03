import { metadataBase, SITE_NAME, SITE_TAGLINE } from "@/app/lib/marketing/site";

/** @param {{ title: string, description: string, path?: string, absoluteTitle?: boolean, type?: 'website' | 'article', publishedTime?: string, modifiedTime?: string, authors?: string[], keywords?: string[] }} input */
export function createPageMetadata({
  title,
  description,
  path = "/",
  absoluteTitle = false,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  keywords,
}) {
  const url = `${metadataBase}${path === "/" ? "" : path}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      type,
      siteName: SITE_NAME,
      locale: "en_US",
      ...(type === "article" && publishedTime
        ? {
            publishedTime,
            modifiedTime: modifiedTime ?? publishedTime,
            authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const defaultSiteMetadata = {
  metadataBase: new URL(metadataBase),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Meridian unifies companies, projects, change requests, client portal access, retention sequences, and health scores in one platform built for modern agencies.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "Meridian unifies companies, projects, change requests, client portal access, retention sequences, and health scores in one platform built for modern agencies.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "Client and project management for agencies — change requests, portal approvals, retention, and health scores.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const privateAppMetadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export function llmsTxtContent() {
  const base = metadataBase;
  return `# ${SITE_NAME} — Client & project management for agencies
# ${base}

> Meridian unifies companies, projects, change requests, client portal access, retention sequences, and health scores for modern agencies.

## Product
- [Home](${base}/)
- [Product overview](${base}/product)
- [Solutions by role](${base}/solutions)

## Resources
- [Guides](${base}/blog)
- [Sign in](${base}/login)
- [Create account](${base}/signup)
- [Full LLM context](${base}/llms-full.txt)

## Direct answer
Meridian is client and project management software for agencies that need structured change approvals, a client portal, retention automation, and client health scoring in one platform.

## Legal
- [Privacy](${base}/privacy)
- [Terms](${base}/terms)
`;
}

export function llmsFullTxtContent() {
  const base = metadataBase;
  return `# ${SITE_NAME} — Full context for LLMs and answer engines
# Site: ${base}

## What is Meridian?
Meridian is client and project management software built for agencies. It combines company and contact records, project delivery (board, list, Gantt, calendar), change request workflows with dual internal and client approvals, a client portal, retention sequences, health scores, contracts, and invoices.

## Core capabilities
1. **Companies & contacts** — Central client records with touchpoints, tags, health history, and linked projects.
2. **Projects & delivery** — Milestones, tasks, budget tracking, and multiple views for agency workflows.
3. **Change requests** — State machine from submission through impact assessment, approvals, and implementation with audit trail.
4. **Client portal** — External stakeholders approve milestones and change requests without email threads.
5. **Retention & health** — Configurable health weights, at-risk dashboard, automated retention sequences on triggers.

## Who it is for
- Account managers monitoring client health and renewals
- Project managers controlling scope with structured change approvals
- Agency leadership seeking one operating picture for delivery and retention
- Client partners who need a focused approval portal

## Guides
- Blog: ${base}/blog
- Change requests guide: ${base}/blog/reduce-change-request-chaos
- Health scores guide: ${base}/blog/client-health-scores-explained

## App access
- Sign up: ${base}/signup
- Sign in: ${base}/login
- Client portal: ${base}/client-login

## Legal
- Privacy: ${base}/privacy
- Terms: ${base}/terms
`;
}
