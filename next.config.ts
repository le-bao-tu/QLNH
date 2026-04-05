import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5016/api/:path*',
      },
    ]
  },
  images: {
    domains: ['localhost', 'img.vietqr.io', 'api.qrserver.com'],
  },
};

export default nextConfig;
