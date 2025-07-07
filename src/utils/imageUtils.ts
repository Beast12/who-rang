import { runtimeConfig } from '@/config/runtime';

// Fix the API_BASE_URL construction to only remove trailing /api
const getApiBaseUrl = () => {
  const apiUrl = runtimeConfig.VITE_API_URL;

  // Only remove /api if it's at the end of the URL
  if (apiUrl.endsWith('/api')) {
    return apiUrl.slice(0, -4); // Remove the last 4 characters ('/api')
  }

  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

export const getImageUrl = (imageUrl: string | undefined | null): string => {
  // Handle null, undefined, or empty string
  if (!imageUrl || typeof imageUrl !== 'string') {
    return getPlaceholderImage();
  }

  // If it's already an absolute URL (starts with http/https), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a relative path from backend (starts with /uploads/), prepend API base URL
  if (imageUrl.startsWith('/uploads/')) {
    return `${API_BASE_URL}${imageUrl}`;
  }

  // If it's just a filename or other relative path, assume it's in uploads
  if (!imageUrl.startsWith('/')) {
    return `${API_BASE_URL}/uploads/${imageUrl}`;
  }

  // Default case - prepend API base URL
  return `${API_BASE_URL}${imageUrl}`;
};

export const getPlaceholderImage = (): string => {
  return '/placeholder.svg';
};
