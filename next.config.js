/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The list screen is now People; old links keep working.
  async redirects() {
    return [{ source: "/professors", destination: "/people", permanent: false }];
  },
  experimental: {
    serverComponentsExternalPackages: ["nodemailer"],
    // Files the server reads at runtime, so they ship with the Vercel functions.
    outputFileTracingIncludes: {
      "/**": ["./templates/**", "./public/SAMPLE_EXCEL_FORMAT.xlsx"],
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
