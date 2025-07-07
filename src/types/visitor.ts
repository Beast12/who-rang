export interface DetectedObject {
  object: string;
  confidence: number;
  description: string;
}

export interface SceneAnalysis {
  overall_confidence: number;
  description: string;
  lighting: string;
  image_quality: string;
}

export interface VisitorEvent {
  id?: number;
  timestamp: string;
  visitor_id: string;
  image_url: string;
  ai_message: string;
  ai_title?: string;
  weather?: string;
  location: string;
  created_at?: string;
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
  // New AI-generated analysis fields
  ai_confidence_score?: number;
  ai_objects_detected?: string; // JSON string of DetectedObject[]
  ai_scene_analysis?: string; // JSON string of SceneAnalysis
  ai_processing_complete?: boolean;
  faces_detected?: number;
  faces_processed?: boolean;
}
