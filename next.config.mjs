/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const repoName = 'data-engineer-certification-app';

const nextConfig = {
  output: 'export',
  // basePath is required for GitHub Pages — the site lives under /<repo-name>/
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  images: {
    // next/image optimisation is not available in static export
    unoptimized: true,
  },
  // Trailing slash ensures all routes resolve correctly on GitHub Pages
  trailingSlash: true,
};

export default nextConfig;
