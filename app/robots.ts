import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lynkskill.net'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // API routes (except public ones)
          '/api/',
          // Admin and sensitive areas
          '/admin/',
          '/settings/',
          // User-specific routes
          '/me/',
          '/profile/',
          // Internal routes
          '/_next/',
          '/favicon.ico',
          '/robots.txt',
        ],
        // Add crawl delay to be respectful to the server
        crawlDelay: 1,
      },
      // Special rules for specific bots
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/settings/',
          '/me/',
          '/profile/',
          '/_next/',
        ],
        crawlDelay: 0.5, // Google can crawl faster
      },
      // Allow public APIs for indexing
      {
        userAgent: '*',
        allow: '/api/public/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
