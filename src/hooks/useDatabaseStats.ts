import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export const useDatabaseStats = () => {
  return useQuery({
    queryKey: ['database-stats'],
    queryFn: () => apiService.getDatabaseStats(),
    staleTime: 30000, // Consider fresh for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
  });
};

export const useClearDatabase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiService.clearDatabase(),
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['database-stats'] });

      toast({
        title: 'Database cleared',
        description: `Successfully deleted ${data.deletedCount} visitor records.`,
        variant: 'destructive',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error clearing database',
        description: error.message || 'Failed to clear database',
        variant: 'destructive',
      });
    },
  });
};
