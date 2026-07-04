/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
