import type { NextConfig } from "next";

const backendURL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8080";

// Build allowed image origins from environment
const allowedImageHosts: { protocol: "http" | "https"; hostname: string; port?: string; pathname: string }[] = [
  // Localhost dev
  { protocol: "http", hostname: "localhost", port: "8080", pathname: "/uploads/**" },
  { protocol: "http", hostname: "127.0.0.1", port: "8080", pathname: "/uploads/**" },
];

// Production: allow HTTPS S3 / CDN host if configured
if (process.env.AWS_PUBLIC_ENDPOINT) {
  try {
    const cdn = new URL(process.env.AWS_PUBLIC_ENDPOINT);
    allowedImageHosts.push({
      protocol: cdn.protocol.replace(":", "") as "http" | "https",
      hostname: cdn.hostname,
      port: cdn.port || undefined,
      pathname: "/**",
    });
  } catch {
    // Invalid URL, skip
  }
}

if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const api = new URL(process.env.NEXT_PUBLIC_API_URL);
    allowedImageHosts.push({
      protocol: api.protocol.replace(":", "") as "http" | "https",
      hostname: api.hostname,
      port: api.port || undefined,
      pathname: "/uploads/**",
    });
  } catch {
    // Invalid URL, skip
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: allowedImageHosts,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendURL}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendURL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
