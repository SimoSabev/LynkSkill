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
            {
                protocol: "https",
                hostname: "cdnjs.cloudflare.com",
            },
        ],
    },
    // ── Performance optimizations ──
    experimental: {
        // Tree-shake heavy packages by auto-converting barrel imports to direct file imports
        optimizePackageImports: [
            "lucide-react",
            "framer-motion",
            "recharts",
            "date-fns",
            "@radix-ui/react-dialog",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-tabs",
            "@radix-ui/react-popover",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-accordion",
            "@radix-ui/react-select",
            "@radix-ui/react-scroll-area",
            "react-markdown",
            "rehype-highlight",
            "highlight.js",
        ],
        serverActions: {
            bodySizeLimit: "50mb", // allow up to 50MB uploads
        },
        // Disable Turbopack font optimization to prevent connection failures
        // when network is unavailable during build
        turbo: {
            resolveAlias: {},
        },
    },
    // Fallback for fonts - use CDN directly instead of Turbopack optimization
    webpack: (config, { isServer }) => {
        // Enable persistent caching for faster rebuilds
        if (!isServer) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    ...config.optimization?.splitChunks,
                    cacheGroups: {
                        ...(typeof config.optimization?.splitChunks === 'object' 
                            ? config.optimization.splitChunks.cacheGroups 
                            : {}),
                        // Split heavy vendor chunks
                        clerkVendor: {
                            test: /[\\/]node_modules[\\/]@clerk[\\/]/,
                            name: 'clerk-vendor',
                            chunks: 'all' as const,
                            priority: 20,
                        },
                        framerMotion: {
                            test: /[\\/]node_modules[\\/](framer-motion|motion)[\\/]/,
                            name: 'framer-motion-vendor',
                            chunks: 'all' as const,
                            priority: 20,
                        },
                        radixVendor: {
                            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                            name: 'radix-vendor',
                            chunks: 'all' as const,
                            priority: 15,
                        },
                    },
                },
            };
        }
        return config;
    },
    // Cache configuration for SEO optimization
    async headers() {
        return [
            {
                source: '/sitemap.xml',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
                    },
                ],
            },
            {
                source: '/robots.txt',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=86400, s-maxage=86400',
                    },
                ],
            },
            {
                source: '/api/public/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=7200',
                    },
                ],
            },
        ];
    },
    // Redirects for SEO canonicalization
    async redirects() {
        return [
            // Redirect www to non-www
            {
                source: '/:path*',
                has: [
                    {
                        type: 'host',
                        value: 'www.lynkskill.net',
                    },
                ],
                destination: 'https://lynkskill.net/:path*',
                permanent: true,
            },
            // Redirect HTTP to HTTPS (handled by hosting, but explicit here)
            {
                source: '/:path*',
                has: [
                    {
                        type: 'header',
                        key: 'x-forwarded-proto',
                        value: 'http',
                    },
                ],
                destination: 'https://lynkskill.net/:path*',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
