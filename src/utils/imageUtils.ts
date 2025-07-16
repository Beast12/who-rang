import { runtimeConfig } from '@/config/runtime';

const API_BASE_URL = runtimeConfig.VITE_API_URL.replace(/\/api$/, '');

export const getImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl) {
    return getPlaceholderImage();
  }

  // If it's already an absolute URL, return as-is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // Ensure the path starts with a slash
  const imagePath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${API_BASE_URL}${imagePath}`;
};

export const getPlaceholderImage = (): string => {
  return '/placeholder.svg';
};
