import { networkInterfaces } from "node:os";

/** @type {import('next').NextConfig} */

/**
 * Next.js 16 blocks cross-origin dev requests (/_next/*, HMR websocket) by default.
 * When testing from another device via http://<lan-ip>:3000 that host must be
 * allowlisted here — and a bare "*" doesn't work: Next's own matcher special-cases
 * and rejects it outright (see node_modules/next/dist/server/app-render/csrf-protection.js,
 * matchWildcardDomain — a single "*" or "**" segment always returns false, on purpose,
 * so a typo can't accidentally open dev-resource access to the entire internet).
 *
 * Since this machine's LAN IP can change (different network, DHCP renewal, a
 * different machine entirely), hardcoding one address just breaks again next
 * time. Instead this walks the actual network interfaces at startup and
 * allowlists whatever IPv4 addresses this machine currently has — so it
 * keeps working across IP changes with no manual edit needed. Set
 * NEXT_DEV_LAN_HOST if you ever need to add one that isn't a local interface
 * (e.g. a port-forwarded/tunnelled address).
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
 */
function localLanIPv4Addresses() {
  const addresses = [];
  for (const iface of Object.values(networkInterfaces())) {
    for (const info of iface ?? []) {
      if (info.family === "IPv4" && !info.internal) {
        addresses.push(info.address);
      }
    }
  }
  return addresses;
}

function buildAllowedDevOrigins() {
  const hosts = new Set(
    [
      process.env.NEXT_DEV_LAN_HOST,
      process.env.NEXT_PUBLIC_DEV_LAN_HOST,
      ...localLanIPv4Addresses(),
      "localhost",
      "127.0.0.1",
    ].filter(Boolean),
  );

  const origins = [];
  for (const host of hosts) {
    origins.push(host);
    if (!host.includes(":")) {
      origins.push(`${host}:3000`);
    }
  }
  return origins;
}

const nextConfig = {
  allowedDevOrigins: buildAllowedDevOrigins(),

  async redirects() {
    return [
      { source: "/pricing", destination: "/", permanent: false },
      { source: "/contact", destination: "/login", permanent: false },
      { source: "/case-studies", destination: "/blog", permanent: false },
      { source: "/case-studies/:slug", destination: "/blog", permanent: false },
    ];
  },
};

export default nextConfig;
