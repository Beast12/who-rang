# 🏠 Home Assistant Integration Guide

**Seamlessly integrate WhoRang with Home Assistant to create powerful doorbell automations with AI-powered visitor analysis.**

---

## 📋 **Overview**

This guide shows you how to connect your Home Assistant instance to WhoRang, enabling you to:

- 🔔 Send doorbell events directly to WhoRang for AI analysis
- 📸 Include camera snapshots with visitor detection
- 🌤️ Add weather context to visitor events
- 🤖 Create intelligent automations based on visitor patterns
- 📊 Track doorbell activity in WhoRang's analytics dashboard

---

## 🚀 **Quick Setup**

### **Prerequisites**

- ✅ WhoRang instance running and accessible
- ✅ Home Assistant with configuration file access
- ✅ WhoRang webhook token (found in Settings → Webhooks)
- ✅ Network connectivity between HA and WhoRang

### **Step 1: Get Your Webhook Details**

1. Open your WhoRang dashboard
2. Go to **Settings** → **Webhooks**
3. Copy your **Webhook URL** and **Authorization Token**

Example:
- **URL**: `https://your-whorang-instance.com/api/webhook/doorbell`
- **Token**: `Bearer your-webhook-token-here`

---

## ⚙️ **Configuration**

### **Step 2: Add REST Command to Home Assistant**

Add the following to your `configuration.yaml` file:

```yaml
rest_command:
  doorbell_webhook:
    url: "https://your-whorang-instance.com/api/webhook/doorbell"
    method: POST
    headers:
      authorization: "Bearer your-webhook-token-here"
      content-type: "application/json"
    payload: |
      {
        "ai_message": "{{ ai_message }}",
        "ai_title": "{{ ai_title | default('Doorbell Alert') }}",
        "location": "{{ location | default('Front Door') }}",
        "image_url": "{{ image_url | default('') }}",
        "device_name": "{{ device_name | default('Doorbell Camera') }}",
        "weather_temperature": {{ weather_temp | default(22.5) }},
        "weather_humidity": {{ weather_humidity | default(65) }},
        "weather_condition": "{{ weather_condition | default('partly-cloudy') }}",
        "weather_wind_speed": {{ wind_speed | default(8.2) }},
        "weather_pressure": {{ pressure | default(1018.3) }}
      }
```

### **Step 3: Restart Home Assistant**

After adding the configuration:
1. **Check Configuration** → Validate your YAML
2. **Restart Home Assistant** to load the new REST command
3. The `rest_command.doorbell_webhook` service will now be available

---

## 🧪 **Testing Your Setup**

### **Using Developer Tools**

1. Go to **Developer Tools** → **Actions**
2. Search for `doorbell_webhook`
3. Use this test payload:

```yaml
action: rest_command.doorbell_webhook
data:
  ai_message: >-
    A delivery person is at your front door holding a package from Amazon. They
    appear to be waiting for someone to answer.
  ai_title: Package Delivery Detected
  location: Front Door
  image_url: https://your-camera-snapshot-url.jpg
  weather_temp: 22.5
  weather_humidity: 65
  weather_condition: sunny
  wind_speed: 8.2
  pressure: 1018.3
  device_name: Front Door Camera
```

4. Click **Perform Action**
5. Check your WhoRang dashboard for the new visitor entry

---

## 🔧 **Payload Reference**

### **Required Fields**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `ai_message` | string | AI-generated description of the visitor/event | `"A delivery person with a package"` |

### **Optional Fields**

| Field | Type | Description | Default | Example |
|-------|------|-------------|---------|---------|
| `ai_title` | string | Title/summary of the event | `"Doorbell Alert"` | `"Package Delivery"` |
| `location` | string | Location of the doorbell/camera | `"Front Door"` | `"Main Entrance"` |
| `image_url` | string | URL to camera snapshot | `""` | `"https://ha.local/snapshot.jpg"` |
| `device_name` | string | Name of the camera/doorbell device | `"Doorbell Camera"` | `"Ring Doorbell Pro"` |
| `weather_temperature` | number | Current temperature (°C) | `22.5` | `18.3` |
| `weather_humidity` | number | Current humidity (%) | `65` | `72` |
| `weather_condition` | string | Weather condition | `"partly-cloudy"` | `"rainy"` |
| `weather_wind_speed` | number | Wind speed (km/h) | `8.2` | `12.5` |
| `weather_pressure` | number | Atmospheric pressure (hPa) | `1018.3` | `1015.2` |

---

## 🤖 **Automation Examples**

### **Basic Doorbell Button Press**

```yaml
automation:
  - alias: "Doorbell Pressed - Send to WhoRang"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door_doorbell
        to: "on"
    action:
      - service: rest_command.doorbell_webhook
        data:
          ai_message: "Someone pressed the doorbell button"
          ai_title: "Doorbell Button Pressed"
          location: "Front Door"
          device_name: "{{ trigger.to_state.attributes.friendly_name }}"
          weather_temp: "{{ states('sensor.outdoor_temperature') | float }}"
          weather_humidity: "{{ states('sensor.outdoor_humidity') | float }}"
          weather_condition: "{{ states('weather.home') }}"
          wind_speed: "{{ state_attr('weather.home', 'wind_speed') | float }}"
          pressure: "{{ state_attr('weather.home', 'pressure') | float }}"
```

### **Motion Detection with Camera Snapshot**

```yaml
automation:
  - alias: "Front Door Motion - Capture and Analyze"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door_motion
        to: "on"
    condition:
      - condition: time
        after: "06:00:00"
        before: "23:00:00"
    action:
      - service: camera.snapshot
        target:
          entity_id: camera.front_door
        data:
          filename: "/config/www/snapshots/doorbell_{{ now().strftime('%Y%m%d_%H%M%S') }}.jpg"
      - delay: "00:00:02"
      - service: rest_command.doorbell_webhook
        data:
          ai_message: "Motion detected at the front door. Please analyze the visitor."
          ai_title: "Motion Detection Alert"
          location: "Front Door"
          image_url: "https://your-ha-instance.com/local/snapshots/doorbell_{{ now().strftime('%Y%m%d_%H%M%S') }}.jpg"
          device_name: "Front Door Camera"
          weather_temp: "{{ states('sensor.outdoor_temperature') | float }}"
          weather_humidity: "{{ states('sensor.outdoor_humidity') | float }}"
          weather_condition: "{{ states('weather.home') }}"
          wind_speed: "{{ state_attr('weather.home', 'wind_speed') | float }}"
          pressure: "{{ state_attr('weather.home', 'pressure') | float }}"
```

### **Smart Delivery Detection**

```yaml
automation:
  - alias: "Smart Delivery Detection"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door_motion
        to: "on"
    condition:
      - condition: time
        after: "08:00:00"
        before: "18:00:00"
      - condition: state
        entity_id: person.homeowner
        state: "not_home"
    action:
      - service: camera.snapshot
        target:
          entity_id: camera.front_door
        data:
          filename: "/config/www/delivery_{{ now().strftime('%Y%m%d_%H%M%S') }}.jpg"
      - delay: "00:00:02"
      - service: rest_command.doorbell_webhook
        data:
          ai_message: "Potential delivery detected while homeowner is away. Please analyze if this is a delivery person and what they might be delivering."
          ai_title: "Delivery Detection - Away Mode"
          location: "Front Door"
          image_url: "https://your-ha-instance.com/local/delivery_{{ now().strftime('%Y%m%d_%H%M%S') }}.jpg"
          device_name: "Front Door Security Camera"
          weather_temp: "{{ states('sensor.outdoor_temperature') | float }}"
          weather_humidity: "{{ states('sensor.outdoor_humidity') | float }}"
          weather_condition: "{{ states('weather.home') }}"
```

---

## 🌤️ **Weather Integration**

WhoRang can correlate visitor patterns with weather conditions. Here's how to include weather data:

### **Using Home Assistant Weather Entity**

```yaml
# In your automation action:
weather_temp: "{{ states('sensor.outdoor_temperature') | float }}"
weather_humidity: "{{ states('sensor.outdoor_humidity') | float }}"
weather_condition: "{{ states('weather.home') }}"
wind_speed: "{{ state_attr('weather.home', 'wind_speed') | float }}"
pressure: "{{ state_attr('weather.home', 'pressure') | float }}"
```

### **Weather Condition Mapping**

WhoRang recognizes these weather conditions:
- `clear-night`, `cloudy`, `fog`, `hail`, `lightning`, `lightning-rainy`
- `partlycloudy`, `pouring`, `rainy`, `snowy`, `snowy-rainy`, `sunny`, `windy`

---

## 🔧 **Advanced Configuration**

### **Multiple Cameras/Doorbells**

```yaml
rest_command:
  front_door_webhook:
    url: "https://your-whorang-instance.com/api/webhook/doorbell"
    method: POST
    headers:
      authorization: "Bearer your-webhook-token"
      content-type: "application/json"
    payload: |
      {
        "ai_message": "{{ ai_message }}",
        "ai_title": "{{ ai_title | default('Front Door Alert') }}",
        "location": "Front Door",
        "device_name": "Front Door Camera",
        "image_url": "{{ image_url | default('') }}"
      }
  
  back_door_webhook:
    url: "https://your-whorang-instance.com/api/webhook/doorbell"
    method: POST
    headers:
      authorization: "Bearer your-webhook-token"
      content-type: "application/json"
    payload: |
      {
        "ai_message": "{{ ai_message }}",
        "ai_title": "{{ ai_title | default('Back Door Alert') }}",
        "location": "Back Door",
        "device_name": "Back Door Camera",
        "image_url": "{{ image_url | default('') }}"
      }
```

### **Dynamic AI Messages**

Create context-aware AI messages based on Home Assistant state:

```yaml
ai_message: >-
  {% if is_state('sun.sun', 'below_horizon') %}
    A visitor arrived at night at {{ now().strftime('%H:%M') }}.
  {% elif is_state('weather.home', 'rainy') %}
    A visitor arrived in the rain.
  {% elif is_state('person.homeowner', 'not_home') %}
    A visitor arrived while nobody is home.
  {% else %}
    A visitor has arrived at the front door.
  {% endif %}
  Please analyze who this might be and their purpose.
```

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **❌ REST Command Not Found**
- **Problem**: `rest_command.doorbell_webhook` doesn't appear in Developer Tools
- **Solution**: Check YAML syntax, restart Home Assistant, verify indentation

#### **❌ 401 Unauthorized Error**
- **Problem**: Authentication failed
- **Solution**: Verify webhook token in WhoRang settings, check Bearer token format

#### **❌ 404 Not Found Error**
- **Problem**: Webhook URL incorrect
- **Solution**: Verify WhoRang URL, check if `/api/webhook/doorbell` endpoint exists

#### **❌ No Data in WhoRang**
- **Problem**: Request sent but no visitor appears
- **Solution**: Check WhoRang logs, verify payload format, test with minimal data

### **Testing Connectivity**

Test your webhook URL directly:

```bash
curl -X POST "https://your-whorang-instance.com/api/webhook/doorbell" \
  -H "Authorization: Bearer your-webhook-token" \
  -H "Content-Type: application/json" \
  -d '{
    "ai_message": "Test message from Home Assistant",
    "ai_title": "Connection Test",
    "location": "Test Location"
  }'
```

### **Debugging Tips**

1. **Check Home Assistant Logs**: Look for REST command errors
2. **Verify Network Access**: Ensure HA can reach WhoRang
3. **Test Minimal Payload**: Start with just required fields
4. **Check WhoRang Logs**: Look for incoming webhook requests
5. **Validate JSON**: Ensure payload is valid JSON format

---

## 📊 **Analytics & Insights**

Once integrated, you'll see rich analytics in WhoRang:

- **Visitor Patterns**: Peak times, frequency analysis
- **Weather Correlation**: How weather affects visitor behavior
- **Device Performance**: Which cameras/doorbells are most active
- **AI Analysis Trends**: Common visitor types and purposes

---

## 🎯 **Best Practices**

### **Performance**
- ⚡ Use conditions to avoid unnecessary webhook calls
- 📸 Optimize image sizes for faster uploads
- ⏱️ Add delays between camera snapshot and webhook call

### **Security**
- 🔒 Use HTTPS for webhook URLs
- 🔑 Rotate webhook tokens regularly
- 🛡️ Restrict network access to WhoRang instance

### **Reliability**
- 🔄 Add retry logic for failed webhook calls
- 📝 Log webhook responses for debugging
- ⚠️ Set up alerts for webhook failures

---

## 💡 **Example Use Cases**

- **📦 Package Delivery Tracking**: Automatically log delivery attempts
- **🏠 Home Security**: Monitor visitors when away
- **👥 Guest Management**: Track expected vs unexpected visitors
- **📈 Traffic Analysis**: Understand peak visitor times
- **🌤️ Weather Impact**: Correlate weather with visitor patterns

---

## 🆘 **Support**

Need help with your Home Assistant integration?

- 📖 Check the [WhoRang Documentation](README.md)
- 🐛 Report issues on [GitHub](https://github.com/Beast12/door-scribe-ai-view/issues)
- 💬 Join the community discussions
- 📧 Contact support for complex setups

---

**Happy Automating! 🎉**

*Transform your doorbell into an intelligent visitor management system with the power of Home Assistant and WhoRang.*
