/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nexus/types", "@nexus/ui", "@nexus/database"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
