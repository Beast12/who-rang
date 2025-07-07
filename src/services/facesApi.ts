import axios from 'axios';
import {
  Person,
  PersonWithDetails,
  FaceRecognitionConfig,
  VisitorEventWithPerson,
  FaceRecognitionStats,
  DetectedFace,
  FaceSimilarity,
} from '@/types/faces';
import { runtimeConfig } from '@/config/runtime';

const API_BASE_URL = runtimeConfig.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const facesApi = {
  // Person management
  async getPersons(): Promise<Person[]> {
    const response = await api.get('/faces/persons');
    return response.data;
  },

  async getPerson(id: number): Promise<PersonWithDetails> {
    const response = await api.get(`/faces/persons/${id}`);
    return response.data;
  },

  async createPerson(person: {
    name: string;
    notes?: string;
  }): Promise<Person> {
    const response = await api.post('/faces/persons', person);
    return response.data;
  },

  async updatePerson(
    id: number,
    person: { name: string; notes?: string }
  ): Promise<Person> {
    const response = await api.put(`/faces/persons/${id}`, person);
    return response.data;
  },

  async deletePerson(id: number): Promise<void> {
    await api.delete(`/faces/persons/${id}`);
  },

  // Configuration
  async getFaceConfig(): Promise<FaceRecognitionConfig> {
    const response = await api.get('/faces/config');
    return response.data;
  },

  async updateFaceConfig(
    config: Partial<FaceRecognitionConfig>
  ): Promise<void> {
    await api.put('/faces/config', config);
  },

  // Ollama integration
  async getOllamaModels(): Promise<{
    models: Array<{
      value: string;
      label: string;
      size?: number;
      modified_at?: string;
    }>;
    ollama_url: string;
    total: number;
    error?: string;
    fallback?: boolean;
  }> {
    const response = await api.get('/faces/ollama/models');
    return response.data;
  },

  async testOllamaConnection(): Promise<{
    success: boolean;
    message: string;
    ollama_url: string;
    version?: string;
  }> {
    const response = await api.post('/faces/ollama/test');
    return response.data;
  },

  // Labeling
  async labelVisitorEvent(
    visitorEventId: number,
    personId?: number,
    confidence?: number
  ): Promise<void> {
    await api.post('/faces/label', {
      visitor_event_id: visitorEventId,
      person_id: personId,
      confidence,
    });
  },

  // Events with person information
  async getEventsWithPersons(
    page = 1,
    limit = 20
  ): Promise<{
    events: VisitorEventWithPerson[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const response = await api.get(`/faces/events?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Statistics
  async getFaceStats(): Promise<FaceRecognitionStats> {
    // This would be implemented as a separate endpoint
    // For now, we'll derive stats from existing data
    const persons = await this.getPersons();
    const totalPersons = persons.length;
    const totalEncodings = persons.reduce(
      (sum, p) => sum + (p.encoding_count || 0),
      0
    );
    const recognizedEvents = persons.reduce(
      (sum, p) => sum + (p.detection_count || 0),
      0
    );

    return {
      totalPersons,
      totalEncodings,
      recognizedEvents,
      unrecognizedEvents: 0, // Would need to be calculated from events
      averageConfidence: 0.75, // Placeholder
    };
  },

  // Enhanced face detection endpoints
  async getUnassignedFaces(
    limit = 50,
    offset = 0,
    qualityThreshold = 0
  ): Promise<{
    faces: DetectedFace[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const response = await api.get(
      `/detected-faces/unassigned?limit=${limit}&offset=${offset}&quality_threshold=${qualityThreshold}`
    );
    return response.data;
  },

  async getPersonFaces(personId: number): Promise<{
    faces: DetectedFace[];
  }> {
    const response = await api.get(`/detected-faces/person/${personId}`);
    return response.data;
  },

  async assignFaceToPerson(
    faceId: number,
    personId: number
  ): Promise<{
    message: string;
    faceId: number;
    personId: number;
    personName: string;
  }> {
    const response = await api.post(`/detected-faces/${faceId}/assign`, {
      personId,
    });
    return response.data;
  },

  async unassignFace(faceId: number): Promise<{
    message: string;
    faceId: number;
  }> {
    const response = await api.post(`/detected-faces/${faceId}/unassign`);
    return response.data;
  },

  async bulkAssignFaces(
    faceIds: number[],
    personId: number
  ): Promise<{
    message: string;
    assignedCount: number;
    totalRequested: number;
    errors?: string[];
  }> {
    const response = await api.post('/detected-faces/bulk-assign', {
      faceIds,
      personId,
    });
    return response.data;
  },

  async getFaceSimilarities(
    faceId: number,
    threshold = 0.6,
    limit = 10
  ): Promise<{
    targetFace: DetectedFace;
    similarities: FaceSimilarity[];
    totalFound: number;
  }> {
    const response = await api.get(
      `/detected-faces/${faceId}/similarities?threshold=${threshold}&limit=${limit}`
    );
    return response.data;
  },

  async deleteFace(faceId: number): Promise<{
    message: string;
    faceId: number;
  }> {
    const response = await api.delete(`/detected-faces/${faceId}`);
    return response.data;
  },

  async getDetectedFaceStats(): Promise<{
    total: number;
    assigned: number;
    unassigned: number;
    qualityDistribution: Array<{
      quality_level: string;
      count: number;
    }>;
    recentActivity: Array<{
      date: string;
      count: number;
    }>;
  }> {
    const response = await api.get('/detected-faces/stats');
    return response.data;
  },
};
