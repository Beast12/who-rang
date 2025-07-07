import axios from 'axios';
import { runtimeConfig } from '@/config/runtime';

const API_BASE_URL = runtimeConfig.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface OpenAIModel {
  value: string;
  label: string;
  created?: number;
  owned_by?: string;
}

export interface OpenAIModelsResponse {
  models: OpenAIModel[];
  total: number;
  current_model: string;
  error?: string;
  fallback?: boolean;
}

export interface OpenAIConnectionTestResponse {
  success: boolean;
  message: string;
  models_available?: boolean;
  debug?: {
    api_key_present: boolean;
    endpoint_url: string;
    response_time_ms?: number;
    error_details?: string;
  };
}

export interface OpenAIUsageStats {
  period: string;
  overall_stats: Array<{
    provider: string;
    total_requests: number;
    total_tokens: number;
    total_cost: number;
    avg_processing_time: number;
    successful_requests: number;
    failed_requests: number;
  }>;
  daily_stats: Array<{
    date: string;
    provider: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
  model_stats: Array<{
    model: string;
    provider: string;
    requests: number;
    tokens: number;
    cost: number;
    avg_time: number;
  }>;
  budget: {
    monthly_limit: number;
    monthly_spent: number;
    remaining: number;
  };
}

export const openaiApi = {
  // Get available OpenAI models
  async getModels(): Promise<OpenAIModelsResponse> {
    const response = await api.get('/openai/models');
    return response.data;
  },

  // Test OpenAI connection
  async testConnection(): Promise<OpenAIConnectionTestResponse> {
    const response = await api.post('/openai/test-connection');
    return response.data;
  },

  // Get usage statistics
  async getUsageStats(period: string = '30d'): Promise<OpenAIUsageStats> {
    const response = await api.get(`/openai/usage/stats?period=${period}`);
    return response.data;
  },

  // Get usage logs
  async getUsageLogs(
    limit: number = 50,
    offset: number = 0,
    provider?: string
  ): Promise<{
    logs: Array<{
      id: number;
      provider: string;
      model: string;
      operation_type: string;
      visitor_event_id?: number;
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      cost_usd: number;
      processing_time_ms: number;
      success: boolean;
      error_message?: string;
      created_at: string;
      visitor_id?: number;
      event_timestamp?: string;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (provider) {
      params.append('provider', provider);
    }

    const response = await api.get(`/openai/usage/logs?${params}`);
    return response.data;
  },
};
