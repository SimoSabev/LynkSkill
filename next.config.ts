import type { NextConfig } from "next";

const nextConfig: NextConfig = {

    experimental: {
        serverActions: {
            bodySizeLimit: "50mb", // allow up to 50MB uploads
        },
    },
};

export default nextConfig;
