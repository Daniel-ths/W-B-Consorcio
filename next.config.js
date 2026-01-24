/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // <--- MUDE ISSO PARA FALSE
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'qkpfsisyaohpdetyhtjd.supabase.co' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
}

module.exports = nextConfig