import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "img.clerk.com",
            },
            {
                protocol: "https",
                hostname: "images.clerk.dev",
            },
            {
                protocol: "https",
                hostname: "fucfjfxmhatybotfuask.supabase.co",
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "50mb", // allow up to 50MB uploads
        },
    },
};

export default nextConfig;
