# WhoRang AI Doorbell Integration

[![GitHub Release][releases-shield]][releases]
[![GitHub Activity][commits-shield]][commits]
[![License][license-shield]](LICENSE)
[![hacs][hacsbadge]][hacs]
[![Project Maintenance][maintenance-shield]][user_profile]
[![BuyMeCoffee][buymecoffeebadge]][buymecoffee]

[![Discord][discord-shield]][discord]
[![Community Forum][forum-shield]][forum]

_Transform your Home Assistant into an intelligent doorbell monitoring system with AI-powered visitor analysis, face recognition, and real-time notifications._

**This integration will set up the following platforms.**

Platform | Description
-- | --
`sensor` | Show visitor statistics, system status, AI metrics, and cost tracking
`binary_sensor` | Doorbell activity, motion detection, visitor presence, and system health
`camera` | Latest doorbell image with automatic updates
`button` | Manual controls for analysis, testing, and data refresh
`select` | AI provider selection and configuration
`device_tracker` | Dynamic presence tracking for known persons

![example][exampleimg]

## Features

### 🔔 **Real-time Doorbell Integration**
- Instant notifications via WebSocket connections
- Doorbell and motion detection binary sensors
- Latest visitor information with AI analysis

### 🧠 **AI-Powered Analysis**
- Support for multiple AI providers (OpenAI, Ollama, Claude, Gemini, Google Cloud Vision)
- Face recognition and known visitor tracking
- Object detection and scene analysis
- Cost tracking for AI usage

### 📊 **Comprehensive Monitoring**
- Visitor statistics (daily, weekly, monthly)
- System health and connectivity status
- AI processing metrics and response times
- Known faces management

### 🎛️ **Control & Automation**
- Manual AI analysis triggers
- AI provider switching
- Webhook testing capabilities
- Data export functionality

### 📸 **Camera Integration**
- Latest doorbell image entity
- Automatic image updates on new visitors
- Integration with Home Assistant camera features

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to "Integrations"
3. Click the three dots menu and select "Custom repositories"
4. Add this repository URL: `https://github.com/Beast12/who-rang`
5. Select "Integration" as the category
6. Click "Add"
7. Search for "WhoRang AI Doorbell" and install
8. Restart Home Assistant

### Manual Installation

1. Download the latest release from the [releases page](https://github.com/Beast12/who-rang/releases)
2. Extract the `whorang` folder to your `custom_components` directory
3. Restart Home Assistant
4. Go to Settings → Devices & Services → Add Integration
5. Search for "WhoRang AI Doorbell"

## Configuration

### Initial Setup

1. Go to **Settings** → **Devices & Services** → **Add Integration**
2. Search for "WhoRang AI Doorbell"
3. Enter your WhoRang system details:
   - **Host**: IP address or hostname of your WhoRang system
   - **Port**: Port number (default: 3001)
   - **API Key**: Optional authentication key

### Options Configuration

After setup, you can configure additional options:

- **Update Interval**: How often to poll for updates (10-300 seconds)
- **Enable WebSocket**: Use WebSocket for real-time updates (recommended)
- **Enable Cost Tracking**: Track AI processing costs and usage

## Entities

### Sensors (9 entities)

| Entity | Description | Unit |
|--------|-------------|------|
| `sensor.whorang_latest_visitor` | Latest visitor information | - |
| `sensor.whorang_visitor_count_today` | Today's visitor count | visitors |
| `sensor.whorang_visitor_count_week` | This week's visitor count | visitors |
| `sensor.whorang_visitor_count_month` | This month's visitor count | visitors |
| `sensor.whorang_system_status` | System health status | - |
| `sensor.whorang_ai_provider_active` | Current AI provider | - |
| `sensor.whorang_ai_cost_today` | Today's AI processing costs | USD |
| `sensor.whorang_ai_response_time` | Latest AI response time | ms |
| `sensor.whorang_known_faces_count` | Number of known faces | faces |

### Binary Sensors (5 entities)

| Entity | Description | Device Class |
|--------|-------------|--------------|
| `binary_sensor.whorang_doorbell` | Recent doorbell activity | - |
| `binary_sensor.whorang_motion` | Motion detection | motion |
| `binary_sensor.whorang_known_visitor` | Known visitor detected | occupancy |
| `binary_sensor.whorang_system_online` | System connectivity | connectivity |
| `binary_sensor.whorang_ai_processing` | AI processing status | - |

### Camera (1 entity)

| Entity | Description |
|--------|-------------|
| `camera.whorang_latest_image` | Latest doorbell camera image |

### Buttons (3 entities)

| Entity | Description |
|--------|-------------|
| `button.whorang_trigger_analysis` | Manually trigger AI analysis |
| `button.whorang_test_webhook` | Test webhook functionality |
| `button.whorang_refresh_data` | Force data refresh |

### Select (1 entity)

| Entity | Description | Options |
|--------|-------------|---------|
| `select.whorang_ai_provider` | AI provider selection | openai, local, claude, gemini, google-cloud-vision |

### Device Trackers (Dynamic)

Dynamic device trackers are created for each known person in the face recognition system:
- `device_tracker.whorang_visitors_[person_name]` - Presence tracking for known visitors

## Services

### `whorang.trigger_analysis`

Manually trigger AI analysis for a visitor.

```yaml
service: whorang.trigger_analysis
data:
  visitor_id: "optional-visitor-id"  # Uses latest if not specified
```

### `whorang.add_known_visitor`

Add a new known person for face recognition.

```yaml
service: whorang.add_known_visitor
data:
  name: "John Doe"
  notes: "Neighbor from next door"  # Optional
```

### `whorang.remove_known_visitor`

Remove a known person from face recognition.

```yaml
service: whorang.remove_known_visitor
data:
  person_id: 1
```

### `whorang.set_ai_provider`

Change the active AI provider.

```yaml
service: whorang.set_ai_provider
data:
  provider: "openai"  # openai, local, claude, gemini, google-cloud-vision
```

### `whorang.export_data`

Export visitor data in specified format.

```yaml
service: whorang.export_data
data:
  start_date: "2024-01-01T00:00:00Z"  # Optional
  end_date: "2024-12-31T23:59:59Z"    # Optional
  format: "json"                       # json or csv
```

### `whorang.test_webhook`

Test webhook functionality.

```yaml
service: whorang.test_webhook
```

## Quick Start Examples

### Essential Doorbell Notification

```yaml
automation:
  - alias: "Doorbell Pressed"
    trigger:
      - platform: state
        entity_id: binary_sensor.whorang_doorbell
        to: "on"
    action:
      - service: notify.mobile_app_your_phone
        data:
          title: "🔔 Doorbell"
          message: "{{ states('sensor.whorang_latest_visitor') }}"
          data:
            image: "/api/camera_proxy/camera.whorang_latest_image"
```

### Known Visitor Welcome

```yaml
automation:
  - alias: "Welcome Known Visitor"
    trigger:
      - platform: state
        entity_id: binary_sensor.whorang_known_visitor
        to: "on"
    action:
      - service: tts.google_translate_say
        data:
          entity_id: media_player.living_room_speaker
          message: >
            Welcome home, {{ state_attr('binary_sensor.whorang_known_visitor', 'person_name') }}!
```

### Security Alert for Unknown Visitors

```yaml
automation:
  - alias: "Unknown Visitor Alert"
    trigger:
      - platform: state
        entity_id: binary_sensor.whorang_doorbell
        to: "on"
    condition:
      - condition: state
        entity_id: binary_sensor.whorang_known_visitor
        state: "off"
    action:
      - service: notify.mobile_app_your_phone
        data:
          title: "🚨 Unknown Visitor"
          message: "{{ states('sensor.whorang_latest_visitor') }}"
          data:
            image: "/api/camera_proxy/camera.whorang_latest_image"
            actions:
              - action: "trigger_analysis"
                title: "Analyze Visitor"
```

## Dashboard Examples

### Quick Setup Dashboard

```yaml
type: vertical-stack
cards:
  - type: picture-entity
    entity: camera.whorang_latest_image
    name: Latest Visitor
    show_state: false
    
  - type: glance
    title: Visitor Statistics
    entities:
      - entity: sensor.whorang_visitor_count_today
        name: Today
      - entity: sensor.whorang_visitor_count_week
        name: Week
      - entity: sensor.whorang_visitor_count_month
        name: Month
      - entity: sensor.whorang_known_faces_count
        name: Known Faces
        
  - type: entities
    title: System Status
    entities:
      - entity: sensor.whorang_system_status
        name: Status
      - entity: binary_sensor.whorang_system_online
        name: Online
      - entity: sensor.whorang_ai_provider_active
        name: AI Provider
      - entity: sensor.whorang_ai_cost_today
        name: AI Cost Today
```

## Events

The integration fires Home Assistant events for automation:

### `whorang_visitor_detected`

Fired when any visitor is detected.

```yaml
automation:
  - alias: "Log All Visitors"
    trigger:
      - platform: event
        event_type: whorang_visitor_detected
    action:
      - service: logbook.log
        data:
          name: "WhoRang"
          message: "Visitor detected: {{ trigger.event.data.ai_message }}"
```

### `whorang_known_visitor_detected`

Fired when a known visitor is detected.

```yaml
automation:
  - alias: "Known Visitor Actions"
    trigger:
      - platform: event
        event_type: whorang_known_visitor_detected
    action:
      - service: light.turn_on
        target:
          entity_id: light.porch_light
```

## Troubleshooting

### Connection Issues

1. **Cannot connect to WhoRang system**
   - Verify the host and port are correct
   - Ensure WhoRang is running and accessible
   - Check firewall settings

2. **WebSocket connection fails**
   - Disable WebSocket in integration options
   - Check network connectivity
   - Verify WhoRang WebSocket endpoint

### Entity Issues

1. **Entities not updating**
   - Check system status sensor
   - Verify WebSocket connection
   - Try refreshing data manually

2. **Missing device trackers**
   - Ensure known persons exist in WhoRang
   - Reload the integration
   - Check integration logs

For more detailed troubleshooting, see our [comprehensive troubleshooting guide](docs/troubleshooting.md).

## Documentation

- [Quick Start Guide](docs/quick-start.md) - 5-minute setup
- [Installation Guide](docs/installation.md) - Detailed installation instructions
- [Configuration Guide](docs/configuration.md) - Complete configuration reference
- [Automation Examples](docs/automation-examples.md) - 15+ ready-to-use automations
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions

## Support

- **Documentation**: [Complete Documentation](docs/)
- **Issues**: [GitHub Issues](https://github.com/Beast12/who-rang/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Beast12/who-rang/discussions)
- **Community**: [Home Assistant Community](https://community.home-assistant.io/)

## Contributing

Contributions are welcome! Please see the [Contributing Guide](../CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

[releases-shield]: https://img.shields.io/github/release/Beast12/who-rang.svg?style=for-the-badge
[releases]: https://github.com/Beast12/who-rang/releases
[commits-shield]: https://img.shields.io/github/commit-activity/y/Beast12/who-rang.svg?style=for-the-badge
[commits]: https://github.com/Beast12/who-rang/commits/main
[hacs]: https://github.com/hacs/integration
[hacsbadge]: https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge
[discord]: https://discord.gg/Qa5fW2R
[discord-shield]: https://img.shields.io/discord/330944238910963714.svg?style=for-the-badge
[exampleimg]: example.png
[forum-shield]: https://img.shields.io/badge/community-forum-brightgreen.svg?style=for-the-badge
[forum]: https://community.home-assistant.io/
[license-shield]: https://img.shields.io/github/license/Beast12/who-rang.svg?style=for-the-badge
[maintenance-shield]: https://img.shields.io/badge/maintainer-%40Beast12-blue.svg?style=for-the-badge
[user_profile]: https://github.com/Beast12
[buymecoffee]: https://www.buymeacoffee.com/Beast12
[buymecoffeebadge]: https://img.shields.io/badge/buy%20me%20a%20coffee-donate-yellow.svg?style=for-the-badge
