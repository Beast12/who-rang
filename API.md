
# API Reference

Complete API documentation for the Smart Doorbell Dashboard.

## Base URL

- Development: `http://localhost:3001/api`
- Production: `https://your-domain.com/api`

## Authentication

Most endpoints require a webhook token for security:

```bash
# Set token in headers
Authorization: Bearer YOUR_WEBHOOK_TOKEN
```

Configure the token in Settings or via environment variable `WEBHOOK_TOKEN`.

---

## Webhook API

### POST /webhook/doorbell

**Primary endpoint for receiving doorbell events from Home Assistant.**

#### Content Types
- `application/json` - JSON payload
- `multipart/form-data` - With image upload

#### Required Parameters
| Field | Type | Description |
|-------|------|-------------|
| `ai_message` | string | AI-generated visitor description |
| `location` | string | Doorbell location (e.g., "Front Door") |

#### Optional Parameters
| Field | Type | Description |
|-------|------|-------------|
| `ai_title` | string | Event title/summary |
| `image_url` | string | Visitor image URL |
| `confidence_score` | number | AI confidence (0-100) |
| `objects_detected` | string | Comma-separated detected objects |
| `device_name` | string | Camera device name |
| `weather_temperature` | number | Temperature in °C |
| `weather_humidity` | number | Humidity percentage |
| `weather_condition` | string | Weather condition |
| `weather_wind_speed` | number | Wind speed |
| `weather_pressure` | number | Atmospheric pressure |

#### Example Request
```bash
curl -X POST http://localhost:3001/api/webhook/doorbell \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "ai_message": "Delivery person with package at front door",
    "ai_title": "Package Delivery",
    "location": "Front Door",
    "confidence_score": 95,
    "objects_detected": "person, package, delivery_truck",
    "weather_temperature": 22.5,
    "weather_condition": "sunny"
  }'
```

#### Response
```json
{
  "success": true,
  "visitor_id": "uuid-string",
  "message": "Event recorded successfully"
}
```

---

## Visitors API

### GET /visitors

**Retrieve paginated visitor list with optional filtering.**

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `search` | string | - | Search in messages and locations |

#### Example Request
```bash
curl "http://localhost:3001/api/visitors?page=1&limit=10&search=delivery"
```

#### Response
```json
{
  "visitors": [
    {
      "id": 1,
      "visitor_id": "uuid-string",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "ai_message": "Delivery person with package",
      "ai_title": "Package Delivery",
      "location": "Front Door",
      "image_url": "/uploads/image.jpg",
      "confidence_score": 95,
      "weather_temperature": 22.5,
      "weather_condition": "sunny"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "hasMore": true
}
```

### GET /visitors/:id

**Get specific visitor details.**

#### Response
```json
{
  "id": 1,
  "visitor_id": "uuid-string",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "ai_message": "Delivery person with package",
  "location": "Front Door",
  "weather_data": "{\"temperature\":22.5,\"condition\":\"sunny\"}"
}
```

### DELETE /visitors/:id

**Delete a specific visitor record.**

#### Response
```json
{
  "success": true,
  "message": "Visitor deleted successfully"
}
```

---

## Stats API

### GET /stats

**Get dashboard statistics.**

#### Response
```json
{
  "today": 5,
  "week": 23,
  "month": 78,
  "total": 234,
  "peakHour": 14,
  "isOnline": true
}
```

---

## Database API

### GET /database/stats

**Get database statistics and health information.**

#### Response
```json
{
  "totalEvents": 234,
  "databaseSize": "2.5 MB",
  "oldestEvent": "2024-01-01T00:00:00.000Z",
  "newestEvent": "2024-01-01T23:59:59.000Z"
}
```

### DELETE /database/clear

**Clear all events from database (destructive operation).**

#### Response
```json
{
  "success": true,
  "deletedCount": 234,
  "message": "All events cleared successfully"
}
```

---

## Configuration API

### GET /config/webhook

**Get current webhook configuration.**

#### Response
```json
{
  "webhookPath": "/api/webhook/doorbell",
  "hasToken": true,
  "tokenLength": 32,
  "allowedOrigins": ["http://localhost:8080"]
}
```

### PUT /config/webhook

**Update webhook configuration.**

#### Request Body
```json
{
  "webhookToken": "new-secure-token",
  "webhookPath": "/api/webhook/doorbell"
}
```

### POST /config/webhook/test

**Send test webhook to verify configuration.**

#### Response
```json
{
  "success": true,
  "message": "Test webhook sent successfully"
}
```

---

## Health Check API

### GET /health

**Basic health check endpoint.**

#### Response
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

## WebSocket Events

Connect to WebSocket at `ws://localhost:3001` for real-time updates.

### Event Types

#### new_visitor
```json
{
  "type": "new_visitor",
  "data": {
    "id": 1,
    "visitor_id": "uuid-string",
    "ai_message": "New visitor detected",
    "location": "Front Door"
  }
}
```

#### stats_update
```json
{
  "type": "stats_update",
  "data": {
    "today": 6,
    "week": 24,
    "month": 79,
    "total": 235
  }
}
```

#### connection_status
```json
{
  "type": "connection_status",
  "data": {
    "status": "connected"
  }
}
```

#### database_cleared
```json
{
  "type": "database_cleared",
  "data": {
    "deletedCount": 234,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## Error Responses

All endpoints return consistent error formats:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "message": "ai_message is required",
  "code": "VALIDATION_ERROR"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing webhook token",
  "code": "AUTH_ERROR"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Visitor not found",
  "code": "NOT_FOUND"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Database connection failed",
  "code": "SERVER_ERROR"
}
```

---

## Rate Limiting

- **Webhook endpoint**: 100 requests per minute per IP
- **Other endpoints**: 1000 requests per minute per IP
- **WebSocket**: 1 connection per IP

---

## Data Types

### Weather Data JSON Format
```json
{
  "temperature": 22.5,
  "humidity": 65,
  "condition": "sunny",
  "wind_speed": 12.3,
  "wind_bearing": 245,
  "pressure": 1013.2,
  "visibility": 10.0,
  "forecast": [
    {
      "datetime": "2024-01-01T12:00:00+00:00",
      "temperature": 24.1,
      "templow": 18.2,
      "condition": "partly-cloudy",
      "precipitation": 0.0
    }
  ]
}
```

### Supported Weather Conditions
- `sunny`, `clear-night`, `partly-cloudy`, `cloudy`
- `rainy`, `snowy`, `fog`, `windy`
- `lightning`, `hail`, `hurricane`

---

For interactive API testing, visit `/api-docs` in the running application.
