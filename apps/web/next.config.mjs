/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nexus/types", "@nexus/ui", "@nexus/database"],
  outputFileTracingIncludes: {
    '/**': [
      '../../node_modules/.pnpm/@prisma+client@*/**/*',
      '../../node_modules/.prisma/client/**/*',
      './node_modules/.prisma/client/**/*',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
