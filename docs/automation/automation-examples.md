# Automation Examples - WhoRang AI Doorbell Integration

Complete collection of ready-to-use automations with beginner explanations and customization options.

## Getting Started with Automations

### How to Add Automations

**Method 1: Home Assistant UI**
1. Go to **Settings** → **Automations & Scenes**
2. Click **Create Automation**
3. Click **Start with an empty automation**
4. Copy and paste the YAML code
5. Click **Save**

**Method 2: YAML File**
1. Add to your `automations.yaml` file
2. Restart Home Assistant or reload automations

### Understanding the Examples

Each automation includes:
- **Purpose**: What it does and why it's useful
- **Triggers**: What starts the automation
- **Conditions**: When it should run (optional)
- **Actions**: What happens when triggered
- **Customization**: How to adapt it to your needs

## Essential Automations (Every User Should Have)

### 1. Basic Doorbell Notification

**Purpose**: Get notified instantly when someone rings your doorbell

```yaml
automation:
  - alias: "WhoRang - Doorbell Notification"
    description: "Send notification when doorbell is pressed"
    trigger:
      - platform: state
        entity_id: binary_sensor.whorang_doorbell
        to: "on"
    action:
      - service: notify.mobile_app_your_phone  # Replace with your device
        data:
          title: "🔔 Doorbell"
          message: "{{ states('sensor.whorang_latest_visitor') }}"
          data:
            image: "/api/camera_proxy/camera.whorang_latest_image"
            actions:
              - action: "view_visitor"
                title: "View Details"
```

**What this does:**
- Triggers when doorbell is pressed
- Sends notification to your phone
- Includes AI description of visitor
- Attaches doorbell image
- Adds action button for more details

**Customization:**
```yaml
# For multiple devices
service: notify.family_group  # Create a group in notify

# Different notification services
service: notify.persistent_notification  # In-app notification
service: notify.alexa_media  # Alexa announcement

# Custom message
message: "Someone is at the door: {{ states('sensor.whorang_latest_visitor') }}"
```

### 2. System Health Monitoring

**Purpose**: Know when your WhoRang system goes offline

```yaml
automation:
  - alias: "WhoRang - System Offline Alert"
    description: "Alert when WhoRang system goes offline"
    trigger:
      - platform: state
        entity_id: binary_sensor.whorang_system_online
        to: "off"
        for: "00:05:00"  # Wait 5 minutes before alerting
    action:
      - service: notify.mobile_app_your_phone
        data:
          title: "🔴 WhoRang System Offline"
          message: "WhoRang doorbell system has been offline for 5 minutes"
          data:
            tag: "system_offline"  # Replaces previous notifications
```

**Why this matters:**
- Ensures you know if the system stops working
- Prevents missed visitors due to system issues
- Helps with troubleshooting

**Customization:**
```yaml
# Different wait times
for: "00:01:00"  # 1 minute (more sensitive)
for: "00:15:00"  # 15 minutes (less sensitive)

# Add automatic restart attempt
action:
  - service: button.press
    target:
      entity_id: button.whorang_refresh_data
  - delay: "00:01:00"
  - service: notify.mobile_app_your_phone
    # ... notification details
```

### 3. AI Cost Monitoring

**Purpose**: Prevent unexpected AI bills by monitoring daily costs

```yaml
automation:
  - alias: "WhoRang - AI Cost Alert"
    description: "Alert when daily AI costs exceed threshold"
    trigger:
      - platform: numeric_state
        entity_id: sensor.whorang_ai_cost_today
        above: 5.00  # $5 daily limit
    action:
      - service: notify.mobile_app_your_phone
        data:
          title: "⚠️ High AI Costs"
          message: "Today's AI costs: ${{ states('sensor.whorang_ai_cost_today') }}"
      - service: whorang.set_ai_provider
        data:
          provider: "local"  # Switch to free local provider
```

**What this prevents:**
- Unexpected high AI bills
- Runaway costs from excessive analysis
- Budget overruns

**Customization:**
```yaml
# Different cost thresholds
above: 1.00   # $1 (conservative)
above: 10.00  # $10 (generous)

# Weekly/monthly limits
trigger:
  - platform: numeric_state
    entity_id: sensor.whorang_ai_cost_week  # If you create this sensor
    above: 25.00
```

## Practical Automations (Common Use Cases)

### 4. Welcome Known Visitors

**Purpose**: Greet family members and friends with personalized messages

```yaml
automation:
  - alias: "WhoRang - Welcome Known Visitor"
    description: "Welcome known visitors with voice announcement"
    trigger:
      - platform: state
        entity_id: binary_sensor.whorang_known_visitor
        to: "on"
    condition:
      - condition: time
        after: "07:00:00"
        before: "22:00:00"  # Only during reasonable hours
    action:
      - service: tts.google_translate_say
        data:
          entity_id: media_player.living_room_speaker
          message: >
            Welcome home, {{ state_attr('binary_sensor.whorang_known_visitor', 'person_name') }}!
      - service: light.turn_on
        target:
          entity_id: light.porch_light
        data:
          brightness: 255
          color_name: "green"
```

**What this creates:**
- Personalized welcome messages
- Visual confirmation with colored lights
- Family-friendly automation

**Customization:**
```yaml
# Different messages by person
message: >
  {% set person = state_attr('binary_sensor.whorang_known_visitor', 'person_name') %}
  {% if person == 'John' %}
    Welcome home, Dad!
  {% elif person == 'Sarah' %}
    Hi Sarah, how was school?
  {% else %}
    Welcome home, {{ person }}!
  {% endif %}

# Different actions by time
action:
  - choose:
      - conditions:
          - condition: time
            after: "18:00:00"
        sequence:
          - service: scene.turn_on
            target:
              entity_id: scene.evening_welcome
      - conditions:
          - condition: time
            before: "12:00:00"
        sequence:
          - service: tts.google_translate_say
            data:
              message: "Good morning, {{ person_name }}!"
```

### 5. Package Delivery Detection

**Purpose**: Automatically detect and log package deliveries

```yaml
automation:
  - alias: "WhoRang - Package Delivery Detection"
    description: "Detect package deliveries based on AI analysis"
    trigger:
      - platform: event
        event_type: whorang_visitor_detected
    condition:
      - condition: template
        value_template: >
          {{ 'package' in trigger.event.data.ai_message.lower() or
             'delivery' in trigger.event.data.ai_message.lower() or
             'ups' in trigger.event.data.ai_message.lower() or
             'fedex' in trigger.event.data.ai_message.lower() or
             'amazon' in trigger.event.data.ai_message.lower() or
             'dhl' in trigger.event.data.ai_message.lower() }}
    action:
      - service: notify.family_group
        data:
          title: "📦 Package Delivery"
          message: "Package delivery detected: {{ trigger.event.data.ai_message }}"
          data:
            image: "/api/camera_proxy/camera.whorang_latest_image"
            tag: "package_delivery"
      - service: input_boolean.turn_on
        target:
          entity_id: input_boolean.package_delivered_today
      - service: logbook.log
        data:
          name: "Package Delivery"
          message: "{{ trigger.event.data.ai_message }}"
```

**What this tracks:**
- Delivery company visits
- Package drop-offs
- Delivery confirmation

**Setup required:**
```yaml
# Add to configuration.yaml
input_boolean:
  package_delivered_today:
    name: "Package Delivered Today"
    icon: mdi:package-variant

# Reset daily
automation:
  - alias: "Reset Package Delivery Flag"
    trigger:
      - platform: time
        at: "00:00:00"
    action:
      - service: input_boolean.turn_off
        target:
          entity_id: input_boolean.package_delivered_today
```

### 6. Security Alert for Unknown Visitors

**Purpose**: Enhanced security monitoring for unknown visitors

```yaml
automation:
  - alias: "WhoRang - Unknown Visitor Security Alert"
    description: "Enhanced security for unknown visitors"
    trigger:
      - platform: state
        entity_id: binary_sensor.whorang_doorbell
        to: "on"
    condition:
      - condition: state
        entity_id: binary_sensor.whorang_known_visitor
        state: "off"
      - condition: state
        entity_id: alarm_control_panel.home_alarm
        state: "armed_away"
    action:
      - service: notify.family_group
        data:
          title: "🚨 Unknown Visitor - Away Mode"
          message: "Unknown visitor while away: {{ states('sensor.whorang_latest_visitor') }}"
          data:
            image: "/api/camera_proxy/camera.whorang_latest_image"
            actions:
              - action: "trigger_analysis"
                title: "Analyze Visitor"
              - action: "call_security"
                title: "Call Security"
      - service: light.turn_on
        target:
          entity_id: light.all_exterior_lights
        data:
          brightness: 255
          color_name: "red"
      - delay: "00:00:05"
      - service: whorang.trigger_analysis  # Get detailed AI analysis
```

**Security features:**
- Only triggers when away
- Immediate notification with image
- Automatic exterior lighting
- Detailed AI analysis
- Action buttons for quick response

### 7. Motion Detection with Smart Lighting

**Purpose**: Automatic lighting based on visitor detection

```yaml
automation:
  - alias: "WhoRang - Smart Porch Lighting"
    description: "Intelligent porch lighting based on motion and time"
    trigger:
      - platform: state
        entity_id: binary_sensor.whorang_motion
        to: "on"
    condition:
      - condition: or
        conditions:
          - condition: sun
            after: sunset
          - condition: sun
            before: sunrise
    action:
      - service: light.turn_on
        target:
          entity_id: light.porch_light
        data:
          brightness: >
            {% if is_state('binary_sensor.whorang_known_visitor', 'on') %}
              255
            {% else %}
              180
            {% endif %}
          color_name: >
            {% if is_state('binary_sensor.whorang_known_visitor', 'on') %}
              green
            {% else %}
              white
            {% endif %}
      - delay: "00:10:00"  # Keep on for 10 minutes
      - service: light.turn_off
        target:
          entity_id: light.porch_light
```

**Smart features:**
- Only activates during dark hours
- Different brightness for known vs unknown visitors
- Color coding for quick identification
- Automatic timeout

## Advanced Automations (Power Users)

### 8. AI Provider Auto-Switching

**Purpose**: Optimize costs by switching AI providers based on conditions

```yaml
automation:
  - alias: "WhoRang - Smart AI Provider Switching"
    description: "Optimize AI provider based on time and cost"
    trigger:
      - platform: time
        at: "23:00:00"  # Night mode
      - platform: time
        at: "07:00:00"  # Day mode
      - platform: numeric_state
        entity_id: sensor.whorang_ai_cost_today
        above: 3.00     # Cost threshold
    action:
      - service: whorang.set_ai_provider
        data:
          provider: >
            {% if now().hour >= 23 or now().hour < 7 %}
              local
            {% elif states('sensor.whorang_ai_cost_today')|float > 3.0 %}
              local
            {% elif states('sensor.whorang_visitor_count_today')|int > 20 %}
              local
            {% else %}
              openai
            {% endif %}
      - service: notify.admin_group
        data:
          title: "🤖 AI Provider Changed"
          message: "Switched to {{ states('select.whorang_ai_provider') }} provider"
```

**Optimization logic:**
- Night hours: Use free local AI
- High costs: Switch to local
- High activity: Switch to local
- Normal conditions: Use premium AI

### 9. Visitor Pattern Analysis

**Purpose**: Track and analyze visitor patterns for insights

```yaml
automation:
  - alias: "WhoRang - Visitor Pattern Analysis"
    description: "Analyze visitor patterns and generate insights"
    trigger:
      - platform: time
        at: "23:30:00"  # End of day analysis
    condition:
      - condition: numeric_state
        entity_id: sensor.whorang_visitor_count_today
        above: 0
    action:
      - service: notify.admin_group
        data:
          title: "📊 Daily Visitor Analysis"
          message: >
            Today's Summary:
            • Total visitors: {{ states('sensor.whorang_visitor_count_today') }}
            • Known visitors: {{ state_attr('sensor.whorang_visitor_count_today', 'known_count') or 0 }}
            • Peak hour: {{ state_attr('sensor.whorang_visitor_count_today', 'peak_hour') or 'Unknown' }}
            • AI cost: ${{ states('sensor.whorang_ai_cost_today') }}
            • Response time: {{ states('sensor.whorang_ai_response_time') }}ms avg
            
            Weekly trend: {{ states('sensor.whorang_visitor_count_week') }} visitors
            {% if states('sensor.whorang_visitor_count_today')|int > states('sensor.whorang_visitor_count_week')|int / 7 * 1.5 %}
            ⚠️ Higher than average activity today
            {% endif %}
```

### 10. Comprehensive Security Automation

**Purpose**: Complete security system integration

```yaml
automation:
  - alias: "WhoRang - Comprehensive Security Response"
    description: "Multi-layered security response for unknown visitors"
    trigger:
      - platform: state
        entity_id: binary_sensor.whorang_motion
        to: "on"
    condition:
      - condition: state
        entity_id: input_boolean.security_mode
        state: "on"
    action:
      - choose:
          # Known visitor - friendly response
          - conditions:
              - condition: state
                entity_id: binary_sensor.whorang_known_visitor
                state: "on"
            sequence:
              - service: light.turn_on
                target:
                  entity_id: light.porch_light
                data:
                  color_name: "green"
              - service: tts.google_translate_say
                data:
                  entity_id: media_player.outdoor_speaker
                  message: "Welcome home!"
          
          # Unknown visitor during day - standard response
          - conditions:
              - condition: state
                entity_id: binary_sensor.whorang_known_visitor
                state: "off"
              - condition: sun
                after: sunrise
                before: sunset
            sequence:
              - service: light.turn_on
                target:
                  entity_id: light.porch_light
                data:
                  color_name: "blue"
              - service: camera.record
                target:
                  entity_id: camera.front_door
                data:
                  duration: 30
              - service: notify.security_team
                data:
                  title: "Visitor During Day"
                  message: "{{ states('sensor.whorang_latest_visitor') }}"
          
          # Unknown visitor at night - high security response
          - conditions:
              - condition: state
                entity_id: binary_sensor.whorang_known_visitor
                state: "off"
              - condition: or
                conditions:
                  - condition: sun
                    after: sunset
                  - condition: sun
                    before: sunrise
            sequence:
              - service: light.turn_on
                target:
                  entity_id: light.all_exterior_lights
                data:
                  brightness: 255
                  color_name: "red"
              - service: siren.turn_on
                target:
                  entity_id: siren.outdoor_alarm
                data:
                  duration: 10
              - service: camera.record
                target:
                  entity_id: camera.all_cameras
                data:
                  duration: 60
              - service: notify.emergency_contacts
                data:
                  title: "🚨 SECURITY ALERT"
                  message: "Unknown visitor at night: {{ states('sensor.whorang_latest_visitor') }}"
                  data:
                    image: "/api/camera_proxy/camera.whorang_latest_image"
                    actions:
                      - action: "call_police"
                        title: "Call Police"
                      - action: "disable_alarm"
                        title: "False Alarm"
```

## Mobile Integration Examples

### 11. Rich Mobile Notifications

**Purpose**: Advanced mobile notifications with actions

```yaml
automation:
  - alias: "WhoRang - Rich Mobile Notification"
    description: "Advanced mobile notification with multiple actions"
    trigger:
      - platform: state
        entity_id: binary_sensor.whorang_doorbell
        to: "on"
    action:
      - service: notify.mobile_app_your_phone
        data:
          title: "🔔 Doorbell - {{ states('sensor.whorang_latest_visitor') }}"
          message: >
            {% if is_state('binary_sensor.whorang_known_visitor', 'on') %}
            Known visitor: {{ state_attr('binary_sensor.whorang_known_visitor', 'person_name') }}
            {% else %}
            Unknown visitor detected
            {% endif %}
          data:
            image: "/api/camera_proxy/camera.whorang_latest_image"
            actions:
              - action: "unlock_door"
                title: "Unlock Door"
                icon: "sfi:lock.open"
              - action: "trigger_analysis"
                title: "Analyze"
                icon: "sfi:brain"
              - action: "two_way_audio"
                title: "Talk"
                icon: "sfi:mic"
              - action: "ignore"
                title: "Ignore"
                icon: "sfi:xmark"
            tag: "doorbell"
            group: "doorbell"
            channel: "doorbell"
            importance: "high"
            ttl: 0
            priority: "high"
```

### 12. Location-Based Automation

**Purpose**: Different responses based on your location

```yaml
automation:
  - alias: "WhoRang - Location-Based Response"
    description: "Different actions based on user location"
    trigger:
      - platform: state
        entity_id: binary_sensor.whorang_doorbell
        to: "on"
    action:
      - choose:
          # At home - simple notification
          - conditions:
              - condition: state
                entity_id: person.your_name
                state: "home"
            sequence:
              - service: notify.mobile_app_your_phone
                data:
                  title: "🔔 Doorbell"
                  message: "Someone at the door"
                  data:
                    tag: "doorbell_home"
          
          # Away from home - detailed notification
          - conditions:
              - condition: not
                conditions:
                  - condition: state
                    entity_id: person.your_name
                    state: "home"
            sequence:
              - service: notify.mobile_app_your_phone
                data:
                  title: "🔔 Doorbell - You're Away"
                  message: "{{ states('sensor.whorang_latest_visitor') }}"
                  data:
                    image: "/api/camera_proxy/camera.whorang_latest_image"
                    actions:
                      - action: "view_live_camera"
                        title: "Live Camera"
                      - action: "call_neighbor"
                        title: "Call Neighbor"
                    tag: "doorbell_away"
                    critical: 1  # iOS critical alert
```

## Troubleshooting Automations

### Common Issues and Solutions

**Automation not triggering:**
```yaml
# Add debugging
action:
  - service: persistent_notification.create
    data:
      title: "Debug: Automation Triggered"
      message: "{{ trigger.entity_id }} changed to {{ trigger.to_state.state }}"
```

**Template errors:**
```yaml
# Safe template with fallback
message: >
  {{ states('sensor.whorang_latest_visitor') | default('Unknown visitor') }}
```

**Mobile app not receiving notifications:**
```yaml
# Test notification
service: notify.mobile_app_your_phone
data:
  title: "Test"
  message: "Testing WhoRang notifications"
  data:
    tag: "test"
```

## Customization Tips

### Personalizing Messages

```yaml
# Time-based greetings
message: >
  {% set hour = now().hour %}
  {% if hour < 12 %}
    Good morning! {{ states('sensor.whorang_latest_visitor') }}
  {% elif hour < 17 %}
    Good afternoon! {{ states('sensor.whorang_latest_visitor') }}
  {% else %}
    Good evening! {{ states('sensor.whorang_latest_visitor') }}
  {% endif %}

# Weather-based messages
message: >
  {{ states('sensor.whorang_latest_visitor') }}
  {% if is_state('weather.home', 'rainy') %}
  (It's raining outside)
  {% endif %}
```

### Conditional Actions

```yaml
# Different actions by day of week
action:
  - choose:
      - conditions:
          - condition: time
            weekday:
              - sat
              - sun
        sequence:
          - service: tts.google_translate_say
            data:
              message: "Weekend visitor!"
      - conditions:
          - condition: time
            weekday:
              - mon
              - tue
              - wed
              - thu
              - fri
        sequence:
          - service: notify.work_phone
            data:
              message: "Visitor during work hours"
```

## Next Steps

- **[Entity Reference](../usage/entities-guide.md)** - Complete entity documentation
- **[Services Guide](../usage/services-guide.md)** - All available services
- **[Troubleshooting](../troubleshooting/common-issues.md)** - Common automation issues
- **[Dashboard Examples](../usage/dashboard-examples.md)** - UI integration examples
