import type { NextConfig } from "next";

const basePath = process.env.GITHUB_PAGES === "true" ? "/financas-codecraft/docs" : "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
