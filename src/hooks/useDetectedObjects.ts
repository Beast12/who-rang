import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useDetectedObjects = () => {
  return useQuery({
    queryKey: ['detected-objects'],
    queryFn: () => apiService.getDetectedObjects(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
