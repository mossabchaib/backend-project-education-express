const { S3Client } = require("@aws-sdk/client-s3");

/**
 * Cloudflare R2 is S3-compatible, so we reuse the AWS S3 SDK pointed at the
 * account-specific R2 endpoint. This file ONLY initializes the client —
 * following the same pattern as config/supabaseClient.js.
 */

const REQUIRED_ENV_VARS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
];

REQUIRED_ENV_VARS.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`[cloudflareR2] Missing required environment variable: ${key}`);
  }
});

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

module.exports = {
  r2Client,
  bucketName: process.env.R2_BUCKET_NAME,
  // Public base URL for reading files back (custom domain or *.r2.dev).
  // The frontend only ever sees this value baked into `file_url` metadata —
  // never the credentials above.
  publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
};