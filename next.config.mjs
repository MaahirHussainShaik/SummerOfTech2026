/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { allowedOrigins: ['*'] } },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'onnxruntime-node': false,
      'onnxruntime-common': false,
      'onnxruntime-web/dist/ort-web.node.js': false,
    };
    return config;
  },
};
export default nextConfig;
