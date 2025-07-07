import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  openaiApi,
  OpenAIModel,
  OpenAIModelsResponse,
  OpenAIConnectionTestResponse,
  OpenAIUsageStats,
} from '@/services/openaiApi';
import { toast } from '@/hooks/use-toast';

// Get available OpenAI models
export const useOpenAIModels = () => {
  return useQuery<OpenAIModelsResponse>({
    queryKey: ['openai', 'models'],
    queryFn: () => openaiApi.getModels(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 400 error (no API key configured)
      if (error?.response?.status === 400) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Test OpenAI connection
export const useTestOpenAIConnection = () => {
  const queryClient = useQueryClient();

  return useMutation<OpenAIConnectionTestResponse>({
    mutationFn: () => openaiApi.testConnection(),
    onSuccess: (data) => {
      // Refresh models after successful connection test
      queryClient.invalidateQueries({ queryKey: ['openai', 'models'] });
      toast({
        title: 'Connection successful',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to connect to OpenAI API.',
        variant: 'destructive',
      });
    },
  });
};

// Refresh OpenAI models
export const useRefreshOpenAIModels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Invalidate and refetch models
      await queryClient.invalidateQueries({ queryKey: ['openai', 'models'] });
      return queryClient.fetchQuery({ queryKey: ['openai', 'models'] });
    },
    onSuccess: () => {
      toast({
        title: 'Models refreshed',
        description: 'OpenAI models have been refreshed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to refresh OpenAI models.',
        variant: 'destructive',
      });
    },
  });
};

// Get OpenAI usage statistics
export const useOpenAIUsageStats = (period: string = '30d') => {
  return useQuery<OpenAIUsageStats>({
    queryKey: ['openai', 'usage', 'stats', period],
    queryFn: () => openaiApi.getUsageStats(period),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get OpenAI usage logs
export const useOpenAIUsageLogs = (
  limit: number = 50,
  offset: number = 0,
  provider?: string
) => {
  return useQuery({
    queryKey: ['openai', 'usage', 'logs', limit, offset, provider],
    queryFn: () => openaiApi.getUsageLogs(limit, offset, provider),
    staleTime: 30 * 1000, // 30 seconds
  });
};
