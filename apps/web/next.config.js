/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  experimental: {
    typedRoutes: false,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://supreme-flickr-casinos-deserve.trycloudflare.com/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
