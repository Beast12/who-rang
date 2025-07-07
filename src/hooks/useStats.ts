import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => apiService.getStats(),
    staleTime: 10000, // Consider stats fresh for 10 seconds
    gcTime: 60000, // Keep in cache for 1 minute
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiService.healthCheck(),
    staleTime: 5000,
    gcTime: 10000,
    refetchInterval: 10000, // Check health every 10 seconds
    retry: 1,
  });
};
