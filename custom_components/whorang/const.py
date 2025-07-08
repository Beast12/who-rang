"""Constants for the WhoRang AI Doorbell integration."""
from __future__ import annotations

from typing import Final

# Integration domain
DOMAIN: Final = "whorang"

# Configuration constants
CONF_HOST: Final = "host"
CONF_PORT: Final = "port"
CONF_URL: Final = "url"
CONF_USE_SSL: Final = "use_ssl"
CONF_VERIFY_SSL: Final = "verify_ssl"
CONF_API_KEY: Final = "api_key"
CONF_UPDATE_INTERVAL: Final = "update_interval"
CONF_ENABLE_WEBSOCKET: Final = "enable_websocket"
CONF_ENABLE_COST_TRACKING: Final = "enable_cost_tracking"

# Default values
DEFAULT_PORT: Final = 3001
DEFAULT_UPDATE_INTERVAL: Final = 30
DEFAULT_TIMEOUT: Final = 10
DEFAULT_WEBSOCKET_TIMEOUT: Final = 30

# API endpoints
API_HEALTH: Final = "/health"
API_VISITORS: Final = "/api/visitors"
API_STATS: Final = "/api/stats"
API_CONFIG_WEBHOOK: Final = "/api/config/webhook"
API_FACES_CONFIG: Final = "/api/faces/config"
API_FACES_PERSONS: Final = "/api/faces/persons"
API_DETECTED_FACES: Final = "/api/detected-faces"
API_OPENAI: Final = "/api/openai"
WEBSOCKET_PATH: Final = "/ws"

# Entity unique ID prefixes
SENSOR_PREFIX: Final = "sensor"
BINARY_SENSOR_PREFIX: Final = "binary_sensor"
CAMERA_PREFIX: Final = "camera"
DEVICE_TRACKER_PREFIX: Final = "device_tracker"
BUTTON_PREFIX: Final = "button"
SELECT_PREFIX: Final = "select"

# Sensor types
SENSOR_LATEST_VISITOR: Final = "latest_visitor"
SENSOR_VISITOR_COUNT_TODAY: Final = "visitor_count_today"
SENSOR_VISITOR_COUNT_WEEK: Final = "visitor_count_week"
SENSOR_VISITOR_COUNT_MONTH: Final = "visitor_count_month"
SENSOR_SYSTEM_STATUS: Final = "system_status"
SENSOR_AI_PROVIDER_ACTIVE: Final = "ai_provider_active"
SENSOR_AI_COST_TODAY: Final = "ai_cost_today"
SENSOR_AI_RESPONSE_TIME: Final = "ai_response_time"
SENSOR_KNOWN_FACES_COUNT: Final = "known_faces_count"

# Binary sensor types
BINARY_SENSOR_DOORBELL: Final = "doorbell"
BINARY_SENSOR_MOTION: Final = "motion"
BINARY_SENSOR_KNOWN_VISITOR: Final = "known_visitor"
BINARY_SENSOR_SYSTEM_ONLINE: Final = "system_online"
BINARY_SENSOR_AI_PROCESSING: Final = "ai_processing"

# Camera types
CAMERA_LATEST_IMAGE: Final = "latest_image"

# Button types
BUTTON_TRIGGER_ANALYSIS: Final = "trigger_analysis"
BUTTON_TEST_WEBHOOK: Final = "test_webhook"
BUTTON_REFRESH_DATA: Final = "refresh_data"

# Select types
SELECT_AI_PROVIDER: Final = "ai_provider"

# Service names
SERVICE_TRIGGER_ANALYSIS: Final = "trigger_analysis"
SERVICE_ADD_KNOWN_VISITOR: Final = "add_known_visitor"
SERVICE_REMOVE_KNOWN_VISITOR: Final = "remove_known_visitor"
SERVICE_SET_AI_PROVIDER: Final = "set_ai_provider"
SERVICE_SET_AI_MODEL: Final = "set_ai_model"
SERVICE_GET_AVAILABLE_MODELS: Final = "get_available_models"
SERVICE_REFRESH_OLLAMA_MODELS: Final = "refresh_ollama_models"
SERVICE_TEST_OLLAMA_CONNECTION: Final = "test_ollama_connection"
SERVICE_EXPORT_DATA: Final = "export_data"
SERVICE_TEST_WEBHOOK: Final = "test_webhook"

# WebSocket message types
WS_TYPE_NEW_VISITOR: Final = "new_visitor"
WS_TYPE_CONNECTION_STATUS: Final = "connection_status"
WS_TYPE_AI_ANALYSIS_COMPLETE: Final = "ai_analysis_complete"
WS_TYPE_FACE_DETECTION_COMPLETE: Final = "face_detection_complete"
WS_TYPE_SYSTEM_STATUS: Final = "system_status"

# AI Providers
AI_PROVIDERS: Final = [
    "openai",
    "local",
    "claude",
    "gemini",
    "google-cloud-vision"
]

# Device information
MANUFACTURER: Final = "WhoRang"
MODEL: Final = "AI Doorbell System"
SW_VERSION: Final = "1.0.0"

# Attributes
ATTR_VISITOR_ID: Final = "visitor_id"
ATTR_TIMESTAMP: Final = "timestamp"
ATTR_AI_MESSAGE: Final = "ai_message"
ATTR_AI_TITLE: Final = "ai_title"
ATTR_LOCATION: Final = "location"
ATTR_WEATHER: Final = "weather"
ATTR_DEVICE_NAME: Final = "device_name"
ATTR_CONFIDENCE_SCORE: Final = "confidence_score"
ATTR_OBJECTS_DETECTED: Final = "objects_detected"
ATTR_FACES_DETECTED: Final = "faces_detected"
ATTR_PROCESSING_TIME: Final = "processing_time"
ATTR_AI_PROVIDER: Final = "ai_provider"
ATTR_COST_USD: Final = "cost_usd"
ATTR_PERSON_NAME: Final = "person_name"
ATTR_PERSON_ID: Final = "person_id"
ATTR_IMAGE_URL: Final = "image_url"

# Event types for automation
EVENT_VISITOR_DETECTED: Final = f"{DOMAIN}_visitor_detected"
EVENT_KNOWN_VISITOR_DETECTED: Final = f"{DOMAIN}_known_visitor_detected"
EVENT_AI_ANALYSIS_COMPLETE: Final = f"{DOMAIN}_ai_analysis_complete"
EVENT_FACE_DETECTION_COMPLETE: Final = f"{DOMAIN}_face_detection_complete"

# Error messages
ERROR_CANNOT_CONNECT: Final = "cannot_connect"
ERROR_INVALID_AUTH: Final = "invalid_auth"
ERROR_INVALID_URL: Final = "invalid_url"
ERROR_SSL_ERROR: Final = "ssl_error"
ERROR_UNKNOWN: Final = "unknown"
ERROR_TIMEOUT: Final = "timeout"
ERROR_API_ERROR: Final = "api_error"

# State classes
STATE_CLASS_MEASUREMENT: Final = "measurement"
STATE_CLASS_TOTAL: Final = "total"
STATE_CLASS_TOTAL_INCREASING: Final = "total_increasing"

# Device classes
DEVICE_CLASS_TIMESTAMP: Final = "timestamp"
DEVICE_CLASS_DURATION: Final = "duration"
DEVICE_CLASS_MONETARY: Final = "monetary"
DEVICE_CLASS_CONNECTIVITY: Final = "connectivity"
DEVICE_CLASS_MOTION: Final = "motion"
DEVICE_CLASS_OCCUPANCY: Final = "occupancy"

# Units
UNIT_MILLISECONDS: Final = "ms"
UNIT_CURRENCY_USD: Final = "USD"
UNIT_VISITORS: Final = "visitors"
UNIT_FACES: Final = "faces"
