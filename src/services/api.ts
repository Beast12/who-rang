import axios from 'axios';
import {
  APIVisitorEvent,
  StatsResponse,
  DatabaseStatsResponse,
  WebhookConfig,
  WebhookTestPayload,
} from '@/types/api';
import { runtimeConfig } from '@/config/runtime';

const API_BASE_URL = runtimeConfig.VITE_API_URL;

console.log('API Service initialized with base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.message,
      code: error.code,
    });

    // Enhance error message based on type
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      error.message =
        'Backend server is not accessible. Please check if the server is running.';
    } else if (error.response?.status === 502) {
      error.message =
        'Backend server is not responding (502 Bad Gateway). Please check server configuration.';
    } else if (error.response?.status === 0 || !error.response) {
      error.message =
        'Cannot connect to backend server. Please check your network connection and server status.';
    }

    return Promise.reject(error);
  }
);

export const apiService = {
  // Visitors
  async getVisitors(
    page = 1,
    limit = 20,
    search?: string
  ): Promise<{
    visitors: (APIVisitorEvent & {
      person_name?: string;
      recognition_confidence?: number;
    })[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const response = await api.get(
      `/visitors?page=${page}&limit=${limit}${searchParam}`
    );
    return response.data;
  },

  async getVisitorById(
    id: number
  ): Promise<
    APIVisitorEvent & { person_name?: string; recognition_confidence?: number }
  > {
    const response = await api.get(`/visitors/${id}`);
    return response.data;
  },

  async deleteVisitor(id: number): Promise<void> {
    await api.delete(`/visitors/${id}`);
  },

  async getDetectedObjects(): Promise<{
    objects: Array<{
      object: string;
      count: number;
      avgConfidence: number;
    }>;
    total: number;
    totalDetections: number;
  }> {
    const response = await api.get('/visitors/detected-objects');
    return response.data;
  },

  // Stats
  async getStats(): Promise<StatsResponse> {
    const response = await api.get('/stats');
    return response.data;
  },

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get('/health');
    return response.data;
  },

  // Database
  async clearDatabase(): Promise<{ message: string; deletedCount: number }> {
    const response = await api.post('/database/clear');
    return response.data;
  },

  async getDatabaseStats(): Promise<DatabaseStatsResponse> {
    const response = await api.get('/database/stats');
    return response.data;
  },

  async backupDatabase(): Promise<void> {
    const response = await api.get('/database/backup', {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'doorbell-backup.db');
    document.body.appendChild(link);
    link.click();
  },

  // Config
  async getConfig(): Promise<{
    webhook_token: string | null;
    webhook_url: string | null;
    webhook_path: string | null;
  }> {
    const response = await api.get('/config');
    return response.data;
  },

  async updateConfig(config: {
    webhook_url?: string;
    webhook_path?: string;
  }): Promise<void> {
    await api.put('/config', config);
  },

  async regenerateToken(): Promise<{ webhook_token: string }> {
    const response = await api.post('/config/regenerate-token');
    return response.data;
  },

  // Webhook Configuration
  async getWebhookConfig(): Promise<WebhookConfig> {
    const response = await api.get('/config/webhook');
    return response.data;
  },

  async updateWebhookConfig(config: {
    webhook_token?: string;
    webhook_path?: string;
  }): Promise<{ message: string; webhook_url: string; webhook_path: string }> {
    const response = await api.put('/config/webhook', config);
    return response.data;
  },

  async testWebhook(): Promise<{
    message: string;
    test_payload: WebhookTestPayload;
  }> {
    const response = await api.post('/config/webhook/test');
    return response.data;
  },
};
