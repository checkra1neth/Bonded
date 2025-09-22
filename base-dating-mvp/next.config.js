/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'assets.coingecko.com',
      'logos.covalenthq.com',
      'raw.githubusercontent.com',
      'cloudflare-ipfs.com',
      'ipfs.io',
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
}

module.exports = nextConfig