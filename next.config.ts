import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产部署 Netlify 后把域名加进去
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Turbopack 默认开；如果插件有问题再切 webpack
  // reactCompiler: true, // 可选：React Compiler，dev 慢但生产优化
};

export default nextConfig;