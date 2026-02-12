/**
 * Utility functions for handling image URLs
 */

/**
 * Get the full image URL from a relative or absolute path
 * @param imagePath - The image path from the API
 * @param baseUrl - The base URL of the API
 * @returns The full image URL
 */
export function getImageUrl(imagePath: string | null | undefined, baseUrl: string): string | null {
  if (!imagePath) return null;

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  if (imagePath.startsWith('/')) {
    return `${baseUrl.replace(/\/$/, '')}${imagePath}`;
  }

  return `${baseUrl.replace(/\/$/, '')}/${imagePath}`;
}
