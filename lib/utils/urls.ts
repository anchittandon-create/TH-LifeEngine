/**
 * Utility function to get the correct API URL based on environment
 */
export function getApiUrl(path: string): string {
  // In development or when running on the same domain, use relative paths
  // The basePath will be automatically handled by Next.js
  return path;
}

/**
 * Utility function to get the full URL for external links (like downloads)
 */
export function getFullUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  return `${baseUrl}${path}`;
}