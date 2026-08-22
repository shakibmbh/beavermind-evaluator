/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transcripts can be up to ~65KB; keep server action / route body limits generous.
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb"
    }
  }
};

export default nextConfig;
