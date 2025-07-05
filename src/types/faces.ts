
export interface Person {
  id: number;
  name: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  encoding_count?: number;
  detection_count?: number;
}

export interface FaceEncoding {
  id: number;
  person_id: number;
  encoding_data: string;
  confidence?: number;
  image_path?: string;
  created_at: string;
}

export interface PersonVisitorEvent {
  id: number;
  person_id?: number;
  visitor_event_id: number;
  confidence?: number;
  created_at: string;
}

export interface FaceRecognitionConfig {
  id?: number;
  enabled: boolean;
  ai_provider: 'local' | 'openai' | 'claude' | 'gemini' | 'aws' | 'gcp';
  confidence_threshold: number;
  training_images_per_person: number;
  auto_delete_after_days: number;
  background_processing: boolean;
  has_api_key: boolean;
  ollama_url?: string;
  ollama_model?: string;
  openai_model?: string;
  claude_model?: string;
  cost_tracking_enabled?: boolean;
  monthly_budget_limit?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PersonWithDetails extends Person {
  encodings: FaceEncoding[];
  recentEvents: Array<{
    id: number;
    timestamp: string;
    ai_message: string;
    confidence?: number;
  }>;
}

export interface VisitorEventWithPerson {
  id: number;
  timestamp: string;
  visitor_id: string;
  ai_message: string;
  ai_title?: string;
  image_url: string;
  location: string;
  weather?: string;
  person_name?: string;
  recognition_confidence?: number;
}

export interface FaceRecognitionStats {
  totalPersons: number;
  totalEncodings: number;
  recognizedEvents: number;
  unrecognizedEvents: number;
  averageConfidence: number;
}
