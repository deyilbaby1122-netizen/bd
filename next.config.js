/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Rewrite root / to /page so the 3D portfolio page is served correctly
  // This avoids a redirect round-trip and serves /page content at /
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/page',
      },
    ];
  },
};

export default nextConfig;
