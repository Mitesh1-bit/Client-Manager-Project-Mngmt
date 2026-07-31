/** @type {import('next').NextConfig} */
const nextConfig = {
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
