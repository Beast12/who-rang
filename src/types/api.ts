export interface APIVisitorEvent {
  id: number;
  timestamp: string;
  visitor_id: string;
  ai_message: string;
  ai_title?: string;
  image_url: string;
  location: string;
  weather?: string;
  created_at: string;
  confidence_score?: number;
  objects_detected?: string;
  processing_time?: string;
  model_version?: string;
  device_name?: string;
  device_firmware?: string;
  device_battery?: number;
  weather_temperature?: number;
  weather_condition?: string;
  weather_humidity?: number;
  weather_data?: string;
  weather_wind_speed?: number;
  weather_pressure?: number;
}

export interface VisitorsResponse {
  visitors: APIVisitorEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface StatsResponse {
  today: number;
  week: number;
  month: number;
  total: number;
  peakHour: number;
  isOnline: boolean;
}

export interface DatabaseStatsResponse {
  totalEvents: number;
  databaseSize: string;
}

export interface WebhookConfig {
  webhook_url: string;
  webhook_path: string;
  has_token: boolean;
  webhook_token: string | null;
  public_url: string;
}

export interface APIError {
  message: string;
  code?: string;
  status?: number;
}

export interface WebSocketMessage {
  type:
    | 'new_visitor'
    | 'stats_update'
    | 'connection_status'
    | 'database_cleared'
    | 'face_recognized'
    | 'unknown_face_detected';
  data:
    | APIVisitorEvent
    | StatsResponse
    | { status: 'connected' | 'disconnected' }
    | { deletedCount: number; timestamp: string }
    | FaceRecognitionData
    | UnknownFaceData;
}

export interface FaceRecognitionData {
  person_id: number;
  person_name: string;
  confidence: number;
  visitor_event_id: number;
  timestamp: string;
}

export interface UnknownFaceData {
  face_id: number;
  visitor_event_id: number;
  confidence: number;
  timestamp: string;
  image_url: string;
}

export interface WebhookTestPayload {
  event_type: string;
  timestamp: string;
  visitor_id: string;
  message: string;
  test: boolean;
}
