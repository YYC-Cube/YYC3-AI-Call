/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig = {
  // Dockerfile 依赖 .next/standalone；静态导出与 standalone 互斥
  output: isStaticExport ? "export" : "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: isStaticExport,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
