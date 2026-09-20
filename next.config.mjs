const FALLBACK_B64 = "cGsuZXlKMUlqb2lhMkYxYzNSMVltZ3dJaXdpWVNJNkltTnRkVFZ3WTNGallqQXhiR3N5ZVhOaE9USm5iekkzYUdNaWZRLmhPb09NWVgtNng2T1lzdlpQSG0wRlE=";
const DEFAULT_MAPBOX_TOKEN = Buffer.from(FALLBACK_B64, "base64").toString("utf-8");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || DEFAULT_MAPBOX_TOKEN,
  },
};

export default nextConfig;
