/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: '.next',
  // Served at https://<user>.github.io/streamdividend-app/ — asset + link
  // URLs must be scoped to that path or the JS 404s on the profile domain.
  basePath: '/streamdividend-app',
};

export default nextConfig;
