import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryBasePath = process.env.GITHUB_PAGES_BASE_PATH || "/er";

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      basePath: repositoryBasePath,
      assetPrefix: repositoryBasePath,
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
