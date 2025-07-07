import { runtimeConfig } from '@/config/runtime';

// Fix the API_BASE_URL construction to only remove trailing /api
const getApiBaseUrl = () => {
  const apiUrl = runtimeConfig.VITE_API_URL;
  console.log('🔍 Debug imageUtils - VITE_API_URL:', apiUrl);

  // Only remove /api if it's at the end of the URL
  if (apiUrl.endsWith('/api')) {
    const baseUrl = apiUrl.slice(0, -4); // Remove the last 4 characters ('/api')
    console.log(
      '🔍 Debug imageUtils - API_BASE_URL (after removing /api):',
      baseUrl
    );
    return baseUrl;
  }

  console.log(
    '🔍 Debug imageUtils - API_BASE_URL (no /api to remove):',
    apiUrl
  );
  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

export const getImageUrl = (imageUrl: string | undefined | null): string => {
  console.log('🔍 Debug getImageUrl - Input imageUrl:', imageUrl);
  console.log('🔍 Debug getImageUrl - API_BASE_URL:', API_BASE_URL);

  // Handle null, undefined, or empty string
  if (!imageUrl || typeof imageUrl !== 'string') {
    console.log(
      '🔍 Debug getImageUrl - Returning placeholder (null/undefined/empty)'
    );
    return getPlaceholderImage();
  }

  // Handle Home Assistant URLs - convert to backend URLs
  if (imageUrl.startsWith('https://ha.tuxito.be/local/')) {
    // Extract filename from HA URL: https://ha.tuxito.be/local/doorbell_snapshot_1751725545.jpg
    const filename = imageUrl.split('/').pop();
    if (filename) {
      // Map to backend uploads directory
      const finalUrl = `${API_BASE_URL}/uploads/${filename}`;
      console.log(
        '🔍 Debug getImageUrl - Converted HA URL to backend:',
        finalUrl
      );
      return finalUrl;
    }
  }

  // If it's already an absolute URL (starts with http/https), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log(
      '🔍 Debug getImageUrl - Returning absolute URL as-is:',
      imageUrl
    );
    return imageUrl;
  }

  // If it's a relative path from backend (starts with /uploads/), prepend API base URL
  if (imageUrl.startsWith('/uploads/')) {
    const finalUrl = `${API_BASE_URL}${imageUrl}`;
    console.log(
      '🔍 Debug getImageUrl - Constructed URL for /uploads/ path:',
      finalUrl
    );
    return finalUrl;
  }

  // If it's just a filename or other relative path, assume it's in uploads
  if (!imageUrl.startsWith('/')) {
    const finalUrl = `${API_BASE_URL}/uploads/${imageUrl}`;
    console.log(
      '🔍 Debug getImageUrl - Constructed URL for filename:',
      finalUrl
    );
    return finalUrl;
  }

  // Default case - prepend API base URL
  const finalUrl = `${API_BASE_URL}${imageUrl}`;
  console.log('🔍 Debug getImageUrl - Default case URL:', finalUrl);
  return finalUrl;
};

export const getPlaceholderImage = (): string => {
  return '/placeholder.svg';
};
