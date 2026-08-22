/** @type {import('next').NextConfig} */
const nextConfig = {
  // PDFKit loads its built-in AFM font metrics at runtime.
  outputFileTracingIncludes: {
    "/api/inngest": ["./node_modules/pdfkit/js/data/**/*"]
  },
  // Transcripts can be up to ~65KB; keep server action / route body limits generous.
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb"
    }
  }
};

export default nextConfig;
