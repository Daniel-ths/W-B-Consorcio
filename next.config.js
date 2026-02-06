/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      // Seus domínios atuais
      { protocol: 'https', hostname: 'qkpfsisyaohpdetyhtjd.supabase.co' },
      { protocol: 'https', hostname: 'placehold.co' },
      
      // Novos domínios necessários para o carrossel
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'production.autoforce.com' },
    ],
  },
}

module.exports = nextConfig