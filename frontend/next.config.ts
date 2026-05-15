import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const DEFAULT_API_PROXY_TARGET = "https://ity0jkac22.execute-api.ap-northeast-2.amazonaws.com"

function normalizeApiProxyTarget() {
  const configured = process.env.API_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_URL
  return (configured ?? DEFAULT_API_PROXY_TARGET).replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${normalizeApiProxyTarget()}/api/v1/:path*`,
      },
    ]
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  tunnelRoute: "/monitoring",
  sourcemaps: { disable: true },
})
