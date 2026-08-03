/** @type {import('next').NextConfig} */

/**
 * Next.js 16 blocks cross-origin dev requests (/_next/*, HMR websocket) by default.
 * When testing from another device via http://192.168.x.x:3000 you MUST allow that host here.
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
 */
function buildAllowedDevOrigins() {
  const hosts = new Set([
    process.env.NEXT_DEV_LAN_HOST,
    process.env.NEXT_PUBLIC_DEV_LAN_HOST,
    "192.168.0.174",
    "localhost",
    "127.0.0.1",
  ].filter(Boolean));

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
