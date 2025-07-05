
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facesApi } from '@/services/facesApi';
import { toast } from '@/hooks/use-toast';

export const useOllamaModels = () => {
  return useQuery({
    queryKey: ['ollamaModels'],
    queryFn: () => facesApi.getOllamaModels(),
    staleTime: 30000, // Cache for 30 seconds
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

export const useTestOllamaConnection = () => {
  return useMutation({
    mutationFn: () => facesApi.testOllamaConnection(),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Connection successful',
          description: `Connected to Ollama${data.version ? ` ${data.version}` : ''} at ${data.ollama_url}`,
        });
      } else {
        toast({
          title: 'Connection failed',
          description: data.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      console.error('Connection test error:', error);
      toast({
        title: 'Connection test failed',
        description: error.response?.data?.message || error.message || 'Unable to test Ollama connection',
        variant: 'destructive',
      });
    },
  });
};

export const useRefreshOllamaModels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => facesApi.getOllamaModels(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ollamaModels'] });
      if (data.error) {
        toast({
          title: 'Models refreshed with warnings',
          description: data.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Models refreshed',
          description: `Found ${data.total} available models`,
        });
      }
    },
    onError: (error: any) => {
      console.error('Refresh models error:', error);
      toast({
        title: 'Refresh failed',
        description: error.response?.data?.error || error.message || 'Unable to refresh model list',
        variant: 'destructive',
      });
    },
  });
};
