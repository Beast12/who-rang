# Detailed Configuration Guide - WhoRang AI Doorbell Integration

Complete configuration reference for all WhoRang integration options and settings.

## Overview

The WhoRang integration offers flexible configuration options to optimize performance, customize behavior, and integrate with your specific setup.

## Initial Configuration

### Basic Connection Settings

When adding the integration, you'll configure these essential settings:

**[SCREENSHOT PLACEHOLDER: Configuration Dialog]**
*Show: Initial configuration form with all fields*

| Setting | Description | Default | Required |
|---------|-------------|---------|----------|
| **Host** | IP address or hostname of WhoRang system | - | ✅ Yes |
| **Port** | Port number for WhoRang API | 3001 | ✅ Yes |
| **API Key** | Authentication key (if configured) | - | ❌ No |

#### Host Configuration

**Examples of valid host values:**
```
192.168.1.100          # Local IP address
whorang.local          # mDNS hostname
whorang.example.com    # FQDN
10.0.0.50             # Different subnet
```

**Finding your WhoRang host:**
1. Check your WhoRang system's network settings
2. Use network scanner: `nmap -sn 192.168.1.0/24`
3. Check router's connected devices
4. Access WhoRang web interface to verify

#### Port Configuration

**Default port**: 3001

**Custom ports**: If you've changed the WhoRang port:
1. Check WhoRang configuration
2. Verify firewall allows the port
3. Test connectivity: `telnet your-host your-port`

#### API Key (Optional)

**When to use API keys:**
- Enhanced security for exposed systems
- Multi-user environments
- Remote access scenarios

**Setting up API key in WhoRang:**
1. Access WhoRang web interface
2. Go to Settings → Security
3. Generate API key
4. Copy key to Home Assistant configuration

### Connection Validation

The integration automatically validates your connection during setup:

**✅ Successful Connection:**
- "Successfully configured WhoRang AI Doorbell"
- All entities created immediately
- System status shows "online"

**❌ Connection Failures:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Cannot connect" | Network/firewall issue | Check connectivity, firewall rules |
| "Invalid auth" | Wrong API key | Verify API key or leave blank |
| "Timeout" | Slow network/overloaded system | Increase timeout, check system load |
| "API error" | WhoRang system issue | Check WhoRang logs, restart service |

## Advanced Options

After initial setup, configure advanced options for optimal performance:

**[SCREENSHOT PLACEHOLDER: Options Configuration]**
*Show: Integration options dialog with all advanced settings*

### Update Interval

**Setting**: How often to poll WhoRang for updates (when WebSocket is disabled)

**Range**: 10-300 seconds
**Default**: 30 seconds
**Recommended**: 30-60 seconds

**Choosing the right interval:**

| Use Case | Recommended Interval | Reason |
|----------|---------------------|---------|
| High activity area | 10-20 seconds | Faster updates for busy locations |
| Normal home use | 30-60 seconds | Balance of responsiveness and efficiency |
| Low activity/remote | 60-300 seconds | Reduce network traffic |
| WebSocket enabled | 60+ seconds | WebSocket handles real-time updates |

**Performance impact:**
- **Lower values**: More responsive, higher network/CPU usage
- **Higher values**: Less responsive, lower resource usage

### WebSocket Configuration

**Setting**: Enable real-time updates via WebSocket connection

**Default**: Enabled (recommended)
**Benefits**: Instant notifications, reduced polling, better performance

**When to disable WebSocket:**
- Network connectivity issues
- Firewall blocks WebSocket connections
- Debugging connection problems
- Very limited bandwidth

**WebSocket troubleshooting:**
```yaml
# Check WebSocket connectivity
# In Home Assistant logs, look for:
# "WebSocket connected to WhoRang"
# "WebSocket disconnected, will retry"
```

### Cost Tracking

**Setting**: Monitor AI processing costs and usage

**Default**: Enabled
**Benefits**: Budget monitoring, provider optimization, usage analytics

**What gets tracked:**
- Daily AI processing costs
- Request counts per provider
- Average response times
- Cost per analysis

**When to disable:**
- Privacy concerns
- Local-only AI providers
- Simplified dashboard

## Entity Configuration

### Sensor Customization

All sensors can be customized through Home Assistant's entity settings:

**[SCREENSHOT PLACEHOLDER: Entity Customization]**
*Show: Entity settings dialog with customization options*

#### Visitor Count Sensors

**Available sensors:**
- `sensor.whorang_visitor_count_today`
- `sensor.whorang_visitor_count_week`
- `sensor.whorang_visitor_count_month`

**Customization options:**
```yaml
# Example entity customization
sensor.whorang_visitor_count_today:
  friendly_name: "Today's Visitors"
  icon: mdi:account-multiple
  unit_of_measurement: "visitors"
```

#### AI Cost Sensor

**Entity**: `sensor.whorang_ai_cost_today`

**Customization for different currencies:**
```yaml
sensor.whorang_ai_cost_today:
  friendly_name: "AI Costs (EUR)"
  # Note: Conversion handled in templates
```

### Binary Sensor Configuration

#### Doorbell Sensor

**Entity**: `binary_sensor.whorang_doorbell`

**Customization options:**
```yaml
binary_sensor.whorang_doorbell:
  friendly_name: "Front Door Bell"
  icon: mdi:doorbell
  device_class: sound  # Optional override
```

#### Motion Detection

**Entity**: `binary_sensor.whorang_motion`

**Sensitivity considerations:**
- Adjust in WhoRang system, not Home Assistant
- Use conditions in automations for filtering
- Consider time-based restrictions

### Camera Configuration

**Entity**: `camera.whorang_latest_image`

**Image settings:**
- Resolution: Determined by WhoRang system
- Update frequency: Real-time via WebSocket
- Storage: Images not stored in Home Assistant

**Dashboard integration:**
```yaml
type: picture-entity
entity: camera.whorang_latest_image
camera_view: live
show_state: false
show_name: true
```

### Device Tracker Configuration

**Dynamic creation**: Device trackers are automatically created for known persons

**Customization per person:**
```yaml
device_tracker.whorang_visitors_john_doe:
  friendly_name: "John (Doorbell)"
  icon: mdi:account-check
  # Presence timeout handled by integration
```

## AI Provider Configuration

### Supported Providers

The integration supports multiple AI providers for analysis:

| Provider | Type | Requirements | Cost |
|----------|------|--------------|------|
| **OpenAI** | Cloud | API key | Pay per use |
| **Ollama** | Local | Local installation | Free |
| **Claude** | Cloud | API key | Pay per use |
| **Gemini** | Cloud | API key | Pay per use |
| **Google Cloud Vision** | Cloud | Service account | Pay per use |

### Provider Selection

**Via Home Assistant:**
```yaml
# Use the select entity
select.whorang_ai_provider: "openai"

# Or via service call
service: whorang.set_ai_provider
data:
  provider: "openai"
```

**Via WhoRang Interface:**
1. Access WhoRang web interface
2. Go to Settings → AI Providers
3. Configure API keys and settings
4. Select active provider

### Cost Optimization

**Strategies for managing AI costs:**

1. **Use local providers when possible:**
   ```yaml
   # Automation to switch to local during high activity
   automation:
     - alias: "Switch to Local AI During Day"
       trigger:
         - platform: time
           at: "08:00:00"
       action:
         - service: whorang.set_ai_provider
           data:
             provider: "local"
   ```

2. **Monitor daily costs:**
   ```yaml
   automation:
     - alias: "AI Cost Alert"
       trigger:
         - platform: numeric_state
           entity_id: sensor.whorang_ai_cost_today
           above: 5.00
       action:
         - service: notify.mobile_app_your_phone
           data:
             title: "High AI Costs"
             message: "Today's costs: ${{ states('sensor.whorang_ai_cost_today') }}"
   ```

## Network Configuration

### Firewall Settings

**Required ports:**
- **3001/tcp**: HTTP API (default)
- **3001/tcp**: WebSocket (same port)

**Firewall rules example (iptables):**
```bash
# Allow Home Assistant to access WhoRang
iptables -A OUTPUT -p tcp --dport 3001 -d WHORANG_IP -j ACCEPT
iptables -A INPUT -p tcp --sport 3001 -s WHORANG_IP -j ACCEPT
```

### Network Troubleshooting

**Test connectivity:**
```bash
# Test HTTP connection
curl -I http://WHORANG_IP:3001/api/health

# Test from Home Assistant container
docker exec homeassistant curl -I http://WHORANG_IP:3001/api/health
```

**Common network issues:**

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Firewall blocking | Connection timeout | Configure firewall rules |
| Wrong subnet | Cannot reach host | Check network configuration |
| DNS issues | Hostname not resolving | Use IP address or fix DNS |
| Port conflicts | Connection refused | Check port availability |

## Performance Optimization

### Resource Usage

**Memory optimization:**
- Enable WebSocket to reduce polling
- Increase update intervals for low-activity periods
- Disable cost tracking if not needed

**Network optimization:**
- Use local AI providers when possible
- Optimize image quality in WhoRang
- Consider bandwidth limitations

### Monitoring Performance

**Key metrics to monitor:**
```yaml
# Response time monitoring
sensor.whorang_ai_response_time

# System status
sensor.whorang_system_status

# Connection status
binary_sensor.whorang_system_online
```

**Performance automation:**
```yaml
automation:
  - alias: "Performance Alert"
    trigger:
      - platform: numeric_state
        entity_id: sensor.whorang_ai_response_time
        above: 5000  # 5 seconds
    action:
      - service: notify.persistent_notification
        data:
          title: "Slow AI Response"
          message: "Response time: {{ states('sensor.whorang_ai_response_time') }}ms"
```

## Security Configuration

### API Key Management

**Best practices:**
1. Use strong, unique API keys
2. Rotate keys regularly
3. Limit key permissions in WhoRang
4. Monitor key usage

**Key rotation automation:**
```yaml
# Reminder to rotate API keys
automation:
  - alias: "API Key Rotation Reminder"
    trigger:
      - platform: time
        at: "09:00:00"
    condition:
      - condition: template
        value_template: >
          {{ (now().date() - state_attr('automation.api_key_rotation_reminder', 'last_triggered').date()).days > 90 }}
    action:
      - service: notify.persistent_notification
        data:
          title: "Security Reminder"
          message: "Consider rotating WhoRang API key"
```

### Network Security

**Recommendations:**
1. Use VPN for remote access
2. Implement network segmentation
3. Regular security updates
4. Monitor access logs

## Troubleshooting Configuration

### Common Configuration Issues

**Integration won't load:**
1. Check Home Assistant logs
2. Verify file permissions
3. Ensure all dependencies installed
4. Restart Home Assistant

**Entities not updating:**
1. Check system status sensor
2. Verify WebSocket connection
3. Test manual refresh button
4. Review update interval settings

**High resource usage:**
1. Increase update intervals
2. Disable unnecessary features
3. Optimize WhoRang system
4. Monitor network traffic

### Debug Mode

**Enable debug logging:**
```yaml
# configuration.yaml
logger:
  default: info
  logs:
    custom_components.whorang: debug
```

**Debug information includes:**
- API request/response details
- WebSocket connection status
- Entity update cycles
- Error details and stack traces

## Migration and Backup

### Configuration Backup

**Important settings to backup:**
- Integration configuration
- Entity customizations
- Automation using WhoRang entities
- Dashboard configurations

**Backup automation:**
```yaml
automation:
  - alias: "Backup WhoRang Config"
    trigger:
      - platform: time
        at: "02:00:00"
    action:
      - service: backup.create
        data:
          name: "WhoRang Config {{ now().strftime('%Y%m%d') }}"
```

### Migration Between Systems

**Steps for migration:**
1. Export current configuration
2. Install integration on new system
3. Import configuration
4. Update IP addresses/hostnames
5. Test all functionality

## Next Steps

After configuration:

1. **[Quick Start Guide](../quick-start.md)** - Basic setup verification
2. **[Automation Examples](../automation/automation-examples.md)** - Ready-to-use automations
3. **[Troubleshooting](../troubleshooting/common-issues.md)** - Common issues and solutions
4. **[Entity Reference](../usage/entities-guide.md)** - Complete entity documentation
