/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_STATIC_EXPORT === "1" ? "export" : undefined,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_STATIC_EXPORT === "1",
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
