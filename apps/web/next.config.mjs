/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nexus/types", "@nexus/ui"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
