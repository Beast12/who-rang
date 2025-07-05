
# Home Assistant Configuration Guide

Complete guide for integrating the Smart Doorbell Dashboard with Home Assistant.

## Prerequisites

- Home Assistant instance running
- Smart Doorbell Dashboard deployed and accessible
- Camera/doorbell device integrated in Home Assistant
- Network connectivity between Home Assistant and Dashboard

---

## Basic Webhook Setup

### 1. Configure Webhook in Dashboard

1. Navigate to **Settings** in the Dashboard
2. Go to **Webhook** section
3. Set a secure webhook token (recommended)
4. Configure webhook path (default: `/api/webhook/doorbell`)
5. Copy the generated webhook URL

### 2. Add REST Command to Home Assistant

Add to your `configuration.yaml`:

```yaml
rest_command:
  doorbell_webhook:
    url: "http://your-dashboard-host:3001/api/webhook/doorbell"
    method: POST
    headers:
      authorization: "Bearer YOUR_WEBHOOK_TOKEN"
      content-type: "application/json"
    payload: |
      {
        "ai_message": "{{ ai_message }}",
        "ai_title": "{{ ai_title | default('Doorbell Alert') }}",
        "location": "{{ location | default('Front Door') }}",
        "image_url": "{{ image_url | default('') }}",
        "confidence_score": {{ confidence_score | default(90) }},
        "objects_detected": "{{ objects_detected | default('visitor') }}",
        "device_name": "{{ device_name | default('Doorbell Camera') }}"
      }
```

---

## Weather Integration

### Enhanced Configuration with Weather Data

```yaml
rest_command:
  doorbell_webhook_weather:
    url: "http://your-dashboard-host:3001/api/webhook/doorbell"
    method: POST
    headers:
      authorization: "Bearer YOUR_WEBHOOK_TOKEN"
      content-type: "application/json"
    payload: |
      {
        "ai_message": "{{ ai_message }}",
        "ai_title": "{{ ai_title | default('Doorbell Alert') }}",
        "location": "{{ location | default('Front Door') }}",
        "image_url": "{{ image_url | default('') }}",
        "confidence_score": {{ confidence_score | default(90) }},
        "objects_detected": "{{ objects_detected | default('visitor') }}",
        "device_name": "{{ device_name | default('Doorbell Camera') }}",
        "weather_temperature": {{ state_attr('weather.home', 'temperature') | float | default(20) }},
        "weather_humidity": {{ state_attr('weather.home', 'humidity') | int | default(50) }},
        "weather_condition": "{{ states('weather.home') | default('unknown') }}",
        "weather_wind_speed": {{ state_attr('weather.home', 'wind_speed') | float | default(0) }},
        "weather_pressure": {{ state_attr('weather.home', 'pressure') | float | default(1013) }},
        "weather_data": "{{ state_attr('weather.home', 'forecast') | to_json | default('{}') }}"
      }
```

---

## Automation Examples

### Basic Motion Detection

```yaml
automation:
  - alias: "Doorbell Motion Detected"
    description: "Send alert when doorbell motion is detected"
    trigger:
      - platform: state
        entity_id: binary_sensor.doorbell_motion
        to: "on"
    action:
      - service: rest_command.doorbell_webhook
        data:
          ai_message: "Motion detected at front door"
          ai_title: "Motion Alert"
          location: "Front Door"
          confidence_score: 85
          objects_detected: "motion"
          device_name: "{{ state_attr('binary_sensor.doorbell_motion', 'friendly_name') }}"
```

### Button Press with Image

```yaml
automation:
  - alias: "Doorbell Button Pressed"
    description: "Send alert with snapshot when doorbell is pressed"
    trigger:
      - platform: state
        entity_id: binary_sensor.doorbell_button
        to: "on"
    action:
      - service: camera.snapshot
        target:
          entity_id: camera.doorbell_camera
        data:
          filename: "/config/www/doorbell_snapshot.jpg"
      - delay: "00:00:02"
      - service: rest_command.doorbell_webhook
        data:
          ai_message: "Doorbell button pressed - visitor at door"
          ai_title: "Doorbell Pressed"
          location: "Front Door"
          image_url: "http://your-ha-host:8123/local/doorbell_snapshot.jpg"
          confidence_score: 95
          objects_detected: "person, button_press"
          device_name: "Smart Doorbell"
```

### AI-Enhanced Detection

```yaml
automation:
  - alias: "AI Doorbell Analysis"
    description: "Send AI-analyzed doorbell events with weather context"
    trigger:
      - platform: state
        entity_id: binary_sensor.doorbell_person_detected
        to: "on"
    condition:
      - condition: template
        value_template: "{{ trigger.to_state.attributes.objects_detected is defined }}"
    action:
      - service: rest_command.doorbell_webhook_weather
        data:
          ai_message: |
            {% set objects = trigger.to_state.attributes.objects_detected %}
            {% set confidence = trigger.to_state.attributes.confidence | default(90) %}
            {% if 'package' in objects %}
              Package delivery detected with {{ confidence }}% confidence
            {% elif 'person' in objects %}
              Person detected at door with {{ confidence }}% confidence
            {% else %}
              Activity detected at doorbell
            {% endif %}
          ai_title: |
            {% if 'package' in trigger.to_state.attributes.objects_detected %}
              Package Delivery
            {% elif 'person' in trigger.to_state.attributes.objects_detected %}
              Visitor Alert
            {% else %}
              Doorbell Activity
            {% endif %}
          location: "Front Door"
          confidence_score: "{{ trigger.to_state.attributes.confidence | default(90) }}"
          objects_detected: "{{ trigger.to_state.attributes.objects_detected | default('unknown') }}"
          device_name: "AI Doorbell Camera"
```

---

## Advanced Integrations

### Multiple Doorbell Locations

```yaml
rest_command:
  front_door_webhook:
    url: "http://your-dashboard-host:3001/api/webhook/doorbell"
    method: POST
    headers:
      authorization: "Bearer YOUR_WEBHOOK_TOKEN"
      content-type: "application/json"
    payload: |
      {
        "ai_message": "{{ ai_message }}",
        "location": "Front Door",
        "device_name": "Front Door Camera"
      }
  
  back_door_webhook:
    url: "http://your-dashboard-host:3001/api/webhook/doorbell"
    method: POST
    headers:
      authorization: "Bearer YOUR_WEBHOOK_TOKEN"
      content-type: "application/json"
    payload: |
      {
        "ai_message": "{{ ai_message }}",
        "location": "Back Door",
        "device_name": "Back Door Camera"
      }
```

### Time-Based Analysis

```yaml
automation:
  - alias: "Smart Doorbell with Context"
    trigger:
      - platform: state
        entity_id: binary_sensor.doorbell_motion
        to: "on"
    action:
      - service: rest_command.doorbell_webhook_weather
        data:
          ai_message: |
            {% set hour = now().hour %}
            {% if hour < 6 %}
              Late night activity detected at front door
            {% elif hour < 12 %}
              Morning visitor detected
            {% elif hour < 18 %}
              Afternoon visitor or delivery
            {% else %}
              Evening visitor detected
            {% endif %}
          ai_title: |
            {% set hour = now().hour %}
            {% if hour < 6 or hour > 22 %}
              Late Hours Alert
            {% else %}
              Visitor Alert
            {% endif %}
          location: "Front Door"
```

---

## Testing Configuration

### Manual Test
```bash
# Test webhook directly
curl -X POST http://your-dashboard-host:3001/api/webhook/doorbell \
  -H "Authorization: Bearer YOUR_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ai_message": "Test from Home Assistant",
    "ai_title": "Test Alert",
    "location": "Front Door",
    "weather_temperature": 22.5,
    "weather_condition": "sunny"
  }'
```

### Home Assistant Developer Tools

1. Go to **Developer Tools** > **Services**
2. Select `rest_command.doorbell_webhook`
3. Use this YAML data:
```yaml
ai_message: "Test webhook from HA"
ai_title: "Test Alert"
location: "Front Door"
confidence_score: 95
```

### Automation Testing

Add temporary automation for testing:
```yaml
automation:
  - alias: "Test Doorbell Webhook"
    trigger:
      - platform: time
        at: "12:00:00"  # Daily at noon
    action:
      - service: rest_command.doorbell_webhook
        data:
          ai_message: "Daily test - system operational"
          ai_title: "System Test"
          location: "Front Door"
          confidence_score: 100
```

---

## Weather Entity Configuration

Ensure your Home Assistant has a weather entity configured:

### Weather Integration Examples

#### OpenWeatherMap
```yaml
weather:
  - platform: openweathermap
    api_key: YOUR_API_KEY
    mode: daily
```

#### Met.no
```yaml
weather:
  - platform: met
    name: Home Weather
```

#### AccuWeather
```yaml
weather:
  - platform: accuweather
    api_key: YOUR_API_KEY
```

---

## Troubleshooting

### Common Issues

#### Webhook Not Receiving Data
1. Check Home Assistant logs: **Settings** > **System** > **Logs**
2. Verify webhook URL is accessible from Home Assistant
3. Check authentication token
4. Test with curl command

#### Weather Data Missing
1. Verify weather entity exists: `weather.home`
2. Check weather entity attributes
3. Test weather template in Developer Tools

#### Image URLs Not Working
1. Ensure Home Assistant is accessible from Dashboard
2. Check image file permissions
3. Use full HTTP URLs, not relative paths

### Debug Templates

Test your templates in **Developer Tools** > **Template**:

```yaml
# Test weather data extraction
{{ state_attr('weather.home', 'temperature') }}
{{ states('weather.home') }}
{{ state_attr('weather.home', 'forecast') | to_json }}

# Test device attributes
{{ state_attr('binary_sensor.doorbell_motion', 'friendly_name') }}
{{ trigger.to_state.attributes.objects_detected if trigger is defined }}
```

---

## Security Considerations

### Network Security
- Use HTTPS in production
- Configure firewall rules
- Use strong webhook tokens
- Consider VPN for remote access

### Token Management
```bash
# Generate secure token
openssl rand -base64 32

# Or use uuidgen
uuidgen
```

### CORS Configuration
Ensure Dashboard backend allows Home Assistant origin:
```bash
CORS_ORIGIN=http://your-homeassistant-host:8123
```

---

For more configuration examples and troubleshooting, visit the built-in API documentation at `/api-docs` in your Dashboard.
