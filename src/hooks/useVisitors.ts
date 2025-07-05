
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { APIVisitorEvent } from '@/types/api';
import { toast } from '@/hooks/use-toast';

export const useVisitors = (page = 1, limit = 20, search?: string) => {
  return useQuery({
    queryKey: ['visitors', page, limit, search],
    queryFn: () => apiService.getVisitors(page, limit, search),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
};

export const useVisitor = (id: number) => {
  return useQuery({
    queryKey: ['visitor', id],
    queryFn: () => apiService.getVisitorById(id),
    enabled: !!id,
  });
};

export const useDeleteVisitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiService.deleteVisitor(id),
    onSuccess: () => {
      // Invalidate and refetch visitors list
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      toast({
        title: 'Visitor deleted',
        description: 'The visitor record has been removed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete visitor record.',
        variant: 'destructive',
      });
    },
  });
};

export const useAddVisitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (visitor: APIVisitorEvent) => {
      // This would be used by WebSocket to add new visitors
      return Promise.resolve(visitor);
    },
    onSuccess: (newVisitor) => {
      // Add the new visitor to the cache
      queryClient.setQueryData(['visitors', 1, 20], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          visitors: [newVisitor, ...oldData.visitors],
          total: oldData.total + 1,
        };
      });

      // Invalidate stats to get updated counts
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      toast({
        title: 'New visitor detected',
        description: `"${newVisitor.ai_message}"`,
      });
    },
  });
};
