/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // ブラウザ環境でのNode.jsモジュールの代替設定
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        http2: false,
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['googleapis'],
  },
};

module.exports = nextConfig;
