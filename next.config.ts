const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5016/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5016/uploads/:path*',
      },
      {
        source: '/hubs/:path*',
        destination: 'http://localhost:5016/hubs/:path*',
      },
    ]
  },
  images: {
    domains: ['localhost', 'img.vietqr.io', 'api.qrserver.com', 'qr.sepay.vn'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
