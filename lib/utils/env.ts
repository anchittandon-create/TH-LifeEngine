export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;

export const env = {
  GOOGLE_API_KEY,
};

export const hasVercelBlobStorage = !!process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
