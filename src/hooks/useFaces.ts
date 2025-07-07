import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facesApi } from '@/services/facesApi';
import { Person, FaceRecognitionConfig } from '@/types/faces';
import { toast } from '@/hooks/use-toast';

export const usePersons = () => {
  return useQuery({
    queryKey: ['persons'],
    queryFn: () => facesApi.getPersons(),
    staleTime: 30000,
  });
};

export const usePerson = (id: number) => {
  return useQuery({
    queryKey: ['person', id],
    queryFn: () => facesApi.getPerson(id),
    enabled: !!id,
  });
};

export const useCreatePerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (person: { name: string; notes?: string }) =>
      facesApi.createPerson(person),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      toast({
        title: 'Person created',
        description: 'New person profile has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create person profile.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdatePerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      person,
    }: {
      id: number;
      person: { name: string; notes?: string };
    }) => facesApi.updatePerson(id, person),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['person', id] });
      toast({
        title: 'Person updated',
        description: 'Person profile has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update person profile.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeletePerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => facesApi.deletePerson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      toast({
        title: 'Person deleted',
        description: 'Person profile has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete person profile.',
        variant: 'destructive',
      });
    },
  });
};

export const useFaceConfig = () => {
  return useQuery({
    queryKey: ['faceConfig'],
    queryFn: () => facesApi.getFaceConfig(),
    staleTime: 60000,
  });
};

export const useUpdateFaceConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Partial<FaceRecognitionConfig>) =>
      facesApi.updateFaceConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faceConfig'] });
      // Also invalidate Ollama models when config changes
      queryClient.invalidateQueries({ queryKey: ['ollamaModels'] });
      toast({
        title: 'Settings updated',
        description:
          'Face recognition settings have been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to update face recognition settings.',
        variant: 'destructive',
      });
    },
  });
};

export const useLabelVisitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      visitorEventId,
      personId,
      confidence,
    }: {
      visitorEventId: number;
      personId?: number;
      confidence?: number;
    }) => facesApi.labelVisitorEvent(visitorEventId, personId, confidence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['faceEvents'] });
      toast({
        title: 'Visitor labeled',
        description: 'Visitor has been labeled successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to label visitor.',
        variant: 'destructive',
      });
    },
  });
};

export const useEventsWithPersons = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['faceEvents', page, limit],
    queryFn: () => facesApi.getEventsWithPersons(page, limit),
    staleTime: 30000,
  });
};

export const useFaceStats = () => {
  return useQuery({
    queryKey: ['faceStats'],
    queryFn: () => facesApi.getFaceStats(),
    staleTime: 60000,
  });
};

// Enhanced face detection hooks
export const useUnassignedFaces = (
  limit = 50,
  offset = 0,
  qualityThreshold = 0
) => {
  return useQuery({
    queryKey: ['unassignedFaces', limit, offset, qualityThreshold],
    queryFn: () => facesApi.getUnassignedFaces(limit, offset, qualityThreshold),
    staleTime: 30000,
  });
};

export const usePersonFaces = (personId: number) => {
  return useQuery({
    queryKey: ['personFaces', personId],
    queryFn: () => facesApi.getPersonFaces(personId),
    enabled: !!personId,
    staleTime: 30000,
  });
};

export const useAssignFaceToPerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ faceId, personId }: { faceId: number; personId: number }) =>
      facesApi.assignFaceToPerson(faceId, personId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unassignedFaces'] });
      queryClient.invalidateQueries({
        queryKey: ['personFaces', data.personId],
      });
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['detectedFaceStats'] });
      toast({
        title: 'Face assigned',
        description: `Face assigned to ${data.personName} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign face.',
        variant: 'destructive',
      });
    },
  });
};

export const useUnassignFace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (faceId: number) => facesApi.unassignFace(faceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unassignedFaces'] });
      queryClient.invalidateQueries({ queryKey: ['personFaces'] });
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['detectedFaceStats'] });
      toast({
        title: 'Face unassigned',
        description: 'Face has been unassigned successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unassign face.',
        variant: 'destructive',
      });
    },
  });
};

export const useBulkAssignFaces = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      faceIds,
      personId,
    }: {
      faceIds: number[];
      personId: number;
    }) => facesApi.bulkAssignFaces(faceIds, personId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unassignedFaces'] });
      queryClient.invalidateQueries({ queryKey: ['personFaces'] });
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['detectedFaceStats'] });
      toast({
        title: 'Faces assigned',
        description: `${data.assignedCount} faces assigned successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign faces.',
        variant: 'destructive',
      });
    },
  });
};

export const useFaceSimilarities = (
  faceId: number,
  threshold = 0.6,
  limit = 10
) => {
  return useQuery({
    queryKey: ['faceSimilarities', faceId, threshold, limit],
    queryFn: () => facesApi.getFaceSimilarities(faceId, threshold, limit),
    enabled: !!faceId,
    staleTime: 60000,
  });
};

export const useDeleteFace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (faceId: number) => facesApi.deleteFace(faceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unassignedFaces'] });
      queryClient.invalidateQueries({ queryKey: ['personFaces'] });
      queryClient.invalidateQueries({ queryKey: ['detectedFaceStats'] });
      toast({
        title: 'Face deleted',
        description: 'Face has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete face.',
        variant: 'destructive',
      });
    },
  });
};

export const useDetectedFaceStats = () => {
  return useQuery({
    queryKey: ['detectedFaceStats'],
    queryFn: () => facesApi.getDetectedFaceStats(),
    staleTime: 60000,
  });
};
