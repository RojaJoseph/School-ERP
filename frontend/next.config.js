/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',      // Required for Docker multi-stage build
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/uploads/**',
      },
    ],
  },
  async rewrites() {
    return [
      // During development: proxy /api → backend
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
