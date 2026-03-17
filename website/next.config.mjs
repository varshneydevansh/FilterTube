import { fileURLToPath } from "node:url";

const nextConfig = {
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  turbopack: {
    root: fileURLToPath(new URL("./", import.meta.url)),
  },
};

export default nextConfig;
