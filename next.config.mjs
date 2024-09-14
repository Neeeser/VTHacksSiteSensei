/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'avatars.githubusercontent.com',
        },
        {
          protocol: 'https',
          hostname: 'lh3.googleusercontent.com',
        },
        {
          protocol: 'https',
          hostname: 's.gravatar.com',
        },
        {
          protocol: 'https',
          hostname: '*.auth0.com',
        },
      ],
    },
    // ... other configurations
  };
  
  export default nextConfig;