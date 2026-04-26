import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.INTERNAL_API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/images/:path*',
        destination: `${apiUrl}/images/:path*`,
      },
      {
        source: '/storage/:path*',
        destination: `${apiUrl}/storage/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // taglib-wasm のブラウザ版への絶対パス
    const taglibBrowserPath = path.resolve(__dirname, 'lib/vendor/taglib-browser.js');

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        module: false,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        'taglib-wasm': taglibBrowserPath,
      };

      // WASM ファイルの解決を完全に無視させる
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /taglib-web\.wasm$/,
        })
      );
    }

    return config;
  },
};

export default nextConfig;
