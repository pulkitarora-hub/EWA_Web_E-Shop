import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo: trace files from repo root when parent has another lockfile
  outputFileTracingRoot: path.join(__dirname, ".."),
  async redirects() {
    return [
      {
        source: "/enquiry-now",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/enquiry-now/:path*",
        destination: "/contact",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
