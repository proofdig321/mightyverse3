/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        pg: false,
        'pg-native': false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false
      };
    }
    
    // Resolve services directory
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/services': require('path').resolve(__dirname, 'services')
    };
    
    return config;
  },
  transpilePackages: ['@thirdweb-dev/react', '@thirdweb-dev/chains'],
  images: {
    domains: ['gateway.pinata.cloud', 'ipfs.io'],
  },
};

module.exports = nextConfig;
