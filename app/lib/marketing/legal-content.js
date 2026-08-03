/** Structured legal copy for SEO-friendly privacy and terms pages. */

export const LEGAL_LAST_UPDATED = "2026-07-29";

export const privacyPolicyDocument = {
  path: "/privacy",
  metadataTitle: "Privacy policy",
  title: "Meridian privacy policy",
  description:
    "How Meridian collects, uses, stores, and protects personal data for agency teams, administrators, and client portal users.",
  summary:
    "Meridian processes account and client delivery data to operate the platform. We do not sell personal information. Agency organizations control client data uploaded to their workspace.",
  keywords: [
    "Meridian privacy policy",
    "agency software privacy",
    "client portal data protection",
    "SaaS data processing",
  ],
  sections: [
    {
      id: "overview",
      title: "Overview",
      paragraphs: [
        "Meridian provides client and project management software for agencies. This privacy policy explains how we handle personal data when you visit our website, create an organization account, invite team members, or use the client portal.",
        "This policy applies to internal agency users and external client stakeholders who access Meridian through a portal login scoped to their company.",
      ],
    },
    {
      id: "information-we-collect",
      title: "Information we collect",
      paragraphs: [
        "We collect information you provide directly and data generated when you use the service.",
      ],
      list: [
        "Account details — name, work email, organization name, role, and authentication credentials.",
        "Workspace data — companies, contacts, projects, change requests, documents, and retention records your team enters.",
        "Portal activity — approvals, comments, and sign-in events for client stakeholders.",
        "Technical data — device type, browser, IP address, and usage logs needed for security and reliability.",
      ],
    },
    {
      id: "how-we-use-information",
      title: "How we use information",
      paragraphs: [
        "We use personal data to deliver and improve Meridian, maintain security, and communicate about the service.",
      ],
      list: [
        "Provide core features — delivery views, change request workflows, portal approvals, and health scoring.",
        "Authenticate users and enforce role-based access for internal and portal accounts.",
        "Monitor uptime, diagnose errors, and prevent abuse of the API or application.",
        "Send product communications you opt into, such as release notes or onboarding messages.",
        "Meet legal obligations and respond to valid requests where required by law.",
      ],
    },
    {
      id: "client-portal-data",
      title: "Client portal data",
      paragraphs: [
        "Client portal users see only data for the company they are assigned to. Internal users are responsible for inviting portal contacts and ensuring appropriate consent.",
        "Meridian does not use client-uploaded content to train public AI models. Your organization retains ownership of the client and project data stored in its workspace.",
      ],
    },
    {
      id: "data-retention",
      title: "Data retention & deletion",
      paragraphs: [
        "We retain account and workspace data while your organization maintains an active subscription or trial, unless a longer period is required for legal, security, or backup purposes.",
        "Organization administrators may request export or deletion of workspace data subject to contractual terms and applicable law. Contact your organization admin for account-level access questions.",
      ],
    },
    {
      id: "security",
      title: "Security",
      paragraphs: [
        "We apply administrative, technical, and organizational measures designed to protect personal data, including encrypted transport, access controls, and audit logging on sensitive workflows such as change request approvals.",
        "No method of transmission or storage is completely secure. Report suspected security issues promptly through your organization administrator or Meridian support channel.",
      ],
    },
    {
      id: "your-rights",
      title: "Your rights",
      paragraphs: [
        "Depending on your location, you may have rights to access, correct, delete, or restrict processing of your personal data, or to object to certain processing.",
        "Agency employees should contact their organization administrator first. Portal users may contact the agency that invited them. We will assist organizations in responding to valid requests where applicable.",
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      paragraphs: [
        "We may update this privacy policy to reflect product, legal, or regulatory changes. Material updates will be posted on this page with a revised last-updated date.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        "For privacy questions related to your organization workspace, contact your Meridian organization administrator. For general privacy inquiries about Meridian, use the contact channel listed on our website.",
      ],
    },
  ],
};

export const termsOfServiceDocument = {
  path: "/terms",
  metadataTitle: "Terms of service",
  title: "Meridian terms of service",
  description:
    "Terms governing use of Meridian — agency accounts, acceptable use, client portal access, data responsibilities, and service availability.",
  summary:
    "By using Meridian, your organization agrees to these terms. You are responsible for client data uploaded to the platform and for managing portal access for client stakeholders.",
  keywords: [
    "Meridian terms of service",
    "agency SaaS terms",
    "client portal terms",
    "software acceptable use",
  ],
  sections: [
    {
      id: "agreement",
      title: "Agreement to terms",
      paragraphs: [
        "These terms of service govern access to Meridian's website and application. By creating an account, inviting users, or using the client portal, you agree to these terms on behalf of your organization.",
        "If you do not agree, do not use the service. Organization administrators are responsible for ensuring team members and portal contacts comply with these terms.",
      ],
    },
    {
      id: "the-service",
      title: "The service",
      paragraphs: [
        "Meridian provides cloud software for agency client delivery — including company records, project management, change requests, client portal approvals, retention sequences, and health scoring.",
        "Features may evolve over time. We will communicate material changes in advance where required. Beta or preview features may be offered as-is without separate commitments.",
      ],
    },
    {
      id: "accounts",
      title: "Accounts & organizations",
      paragraphs: [
        "Each organization maintains a separate workspace. You must provide accurate account information and keep credentials secure.",
      ],
      list: [
        "Organization administrators manage user invitations, roles, and billing contacts.",
        "You are responsible for activity under accounts you provision, including internal staff and portal users.",
        "Notify us promptly of unauthorized access or suspected compromise.",
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      paragraphs: [
        "You may use Meridian only for lawful agency and client delivery purposes. You may not misuse the platform or interfere with other customers.",
      ],
      list: [
        "Do not attempt unauthorized access to accounts, APIs, or data outside your role scope.",
        "Do not upload malware, scrape the service abusively, or reverse engineer except where permitted by law.",
        "Do not use Meridian to violate applicable law, infringe intellectual property, or harass others.",
        "Do not resell or sublicense the service except as expressly allowed in your agreement.",
      ],
    },
    {
      id: "client-portal",
      title: "Client portal",
      paragraphs: [
        "The client portal provides external stakeholders scoped access to approvals and project visibility for their assigned company.",
        "Internal users are responsible for inviting portal contacts, assigning appropriate permissions, and obtaining any consent required before sharing client data through the portal.",
      ],
    },
    {
      id: "customer-data",
      title: "Customer data",
      paragraphs: [
        "Your organization retains ownership of data you upload to Meridian, including client records, project files, and change request history.",
        "You grant Meridian a limited license to host, process, and display that data solely to provide and improve the service. You represent that you have the rights needed to upload and share customer data.",
      ],
    },
    {
      id: "api",
      title: "API & integrations",
      paragraphs: [
        "Meridian exposes a GraphQL API for authorized integrations. API access is subject to rate limits, authentication requirements, and these terms.",
        "Do not use the API to extract data you are not permitted to access or to build a competing service using Meridian data without authorization.",
      ],
    },
    {
      id: "availability",
      title: "Availability & support",
      paragraphs: [
        "We aim for reliable uptime but do not guarantee uninterrupted service. Planned maintenance and factors outside our control may cause temporary disruption.",
        "Support channels and response targets depend on your plan. Critical security issues should be reported promptly.",
      ],
    },
    {
      id: "termination",
      title: "Suspension & termination",
      paragraphs: [
        "We may suspend or terminate access for violations of these terms, non-payment, or actions that risk harm to the platform or other customers.",
        "You may stop using Meridian at any time. Upon termination, data export and deletion are handled according to your agreement and our privacy policy.",
      ],
    },
    {
      id: "liability",
      title: "Disclaimer & liability",
      paragraphs: [
        "Meridian is provided on an as-available basis to the extent permitted by law. We disclaim implied warranties where allowed.",
        "Our aggregate liability arising from the service is limited to the fees paid by your organization in the twelve months preceding the claim, except where liability cannot be limited by applicable law.",
      ],
    },
    {
      id: "changes",
      title: "Changes to these terms",
      paragraphs: [
        "We may revise these terms to reflect legal, product, or operational updates. Continued use after the effective date of revised terms constitutes acceptance, except where additional consent is required by law.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        "For questions about these terms, contact your organization administrator or the Meridian support channel listed on our website.",
      ],
    },
  ],
};
