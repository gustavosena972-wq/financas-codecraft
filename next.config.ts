import type { NextConfig } from "next";

// Pages publishes the /docs folder as the site root → basePath is only the repo name.
const basePath = process.env.GITHUB_PAGES === "true" ? "/financas-codecraft" : "";

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
