# Troubleshooting Guide - WhoRang AI Doorbell Integration

Complete troubleshooting guide for common issues, error messages, and solutions.

## Quick Diagnosis

### Is Your System Working?

**✅ Quick Health Check:**
1. Check `sensor.whorang_system_status` - should show "online"
2. Check `binary_sensor.whorang_system_online` - should be "on"
3. Visit your WhoRang web interface: `http://your-ip:3001`
4. Look for recent entries in `sensor.whorang_latest_visitor`

**❌ If Any Check Fails:**
- Follow the detailed troubleshooting sections below
- Check Home Assistant logs: Settings → System → Logs
- Look for "whorang" or "custom_components" errors

## Installation Issues

### Integration Not Found

**Symptoms:**
- "WhoRang AI Doorbell" doesn't appear when adding integrations
- Integration search returns no results

**Solutions:**

**1. Verify File Installation**
```bash
# Check if files exist
ls -la config/custom_components/whorang/

# Should show these files:
# __init__.py, manifest.json, const.py, config_flow.py
# api_client.py, coordinator.py, sensor.py, binary_sensor.py
# camera.py, button.py, select.py, device_tracker.py
# services.yaml, strings.json, translations/
```

**2. Check File Permissions**
```bash
# Fix permissions if needed
sudo chown -R homeassistant:homeassistant config/custom_components/whorang/
sudo chmod -R 755 config/custom_components/whorang/
```

**3. Restart Home Assistant**
- Settings → System → Restart
- Wait for complete restart (2-3 minutes)
- Try adding integration again

**4. Check Home Assistant Logs**
```
Settings → System → Logs
Search for: "whorang" or "custom_components"
```

**Common log errors:**
```
# Missing dependencies
ModuleNotFoundError: No module named 'aiohttp'
Solution: Install dependencies or use HACS

# Syntax errors
SyntaxError: invalid syntax
Solution: Re-download integration files

# Permission errors
PermissionError: [Errno 13] Permission denied
Solution: Fix file permissions (see above)
```

### HACS Installation Problems

**Symptoms:**
- Cannot add custom repository
- Repository not found
- Download fails

**Solutions:**

**1. Verify Repository URL**
```
Correct URL: https://github.com/Beast12/who-rang
Category: Integration
```

**2. Check HACS Installation**
- Ensure HACS is properly installed
- Try restarting Home Assistant
- Clear HACS cache: HACS → Settings → Clear Cache

**3. Network Connectivity**
```bash
# Test GitHub connectivity
ping github.com
curl -I https://github.com/Beast12/who-rang
```

**4. Manual Installation Fallback**
- If HACS fails, use manual installation method
- Download from GitHub releases page
- Extract to custom_components directory

## Connection Issues

### Cannot Connect to WhoRang System

**Symptoms:**
- "Cannot connect to WhoRang system" during setup
- Integration setup fails with connection error
- Entities show "unavailable"

**Diagnosis Steps:**

**1. Verify WhoRang is Running**
```bash
# Test web interface
curl -I http://YOUR_WHORANG_IP:3001/api/health

# Expected response:
HTTP/1.1 200 OK
Content-Type: application/json
```

**2. Check Network Connectivity**
```bash
# Test basic connectivity
ping YOUR_WHORANG_IP

# Test port accessibility
telnet YOUR_WHORANG_IP 3001
# Should connect without errors
```

**3. Verify IP Address and Port**
- Check WhoRang system network settings
- Ensure IP hasn't changed (DHCP)
- Verify port configuration (default: 3001)

**4. Firewall Issues**
```bash
# Check if port is blocked
nmap -p 3001 YOUR_WHORANG_IP

# Common firewall solutions:
# Ubuntu/Debian
sudo ufw allow from HOME_ASSISTANT_IP to any port 3001

# CentOS/RHEL
sudo firewall-cmd --add-port=3001/tcp --permanent
sudo firewall-cmd --reload
```

**5. Docker Network Issues**
```bash
# If Home Assistant is in Docker
docker exec homeassistant ping YOUR_WHORANG_IP
docker exec homeassistant curl -I http://YOUR_WHORANG_IP:3001/api/health

# Check Docker network configuration
docker network ls
docker network inspect bridge
```

### Authentication Errors

**Symptoms:**
- "Invalid authentication" error
- "API key required" message
- 401 Unauthorized responses

**Solutions:**

**1. API Key Configuration**
- Leave API key blank if not configured in WhoRang
- If using API key, verify it's correct
- Check WhoRang settings for API key requirements

**2. Reset API Key**
```
1. Access WhoRang web interface
2. Go to Settings → Security
3. Generate new API key
4. Update Home Assistant configuration
```

**3. Test Without API Key**
- Try configuring without API key first
- Add API key later if needed for security

## Entity Issues

### Entities Not Updating

**Symptoms:**
- Entity states don't change
- Old data in sensors
- "Unknown" or "Unavailable" states

**Diagnosis:**

**1. Check System Status**
```yaml
# These should show healthy status:
sensor.whorang_system_status: "online"
binary_sensor.whorang_system_online: "on"
```

**2. Test Manual Refresh**
```yaml
# Press this button to force update
button.whorang_refresh_data
```

**3. Check Update Interval**
- Go to Settings → Devices & Services
- Find WhoRang integration → Configure
- Verify update interval (default: 30 seconds)

**4. WebSocket Connection**
```yaml
# Check WebSocket status in logs
# Look for: "WebSocket connected" or "WebSocket disconnected"
```

**Solutions:**

**1. Restart Integration**
```
Settings → Devices & Services → WhoRang → ⋮ → Reload
```

**2. Adjust Update Interval**
```
Settings → Devices & Services → WhoRang → Configure
Set update interval to 10-20 seconds for testing
```

**3. Disable/Re-enable WebSocket**
```
Settings → Devices & Services → WhoRang → Configure
Toggle "Enable WebSocket" off, save, then on again
```

**4. Check WhoRang System Load**
- High CPU/memory usage can cause delays
- Restart WhoRang system if needed
- Check WhoRang logs for errors

### Missing Device Trackers

**Symptoms:**
- No device tracker entities created
- Expected person trackers missing

**Causes & Solutions:**

**1. No Known Persons Configured**
```
Solution: Add known persons in WhoRang system
1. Access WhoRang web interface
2. Go to Faces → Known Persons
3. Add at least one person
4. Reload Home Assistant integration
```

**2. Face Recognition Disabled**
```
Solution: Enable face recognition
1. WhoRang Settings → Face Recognition
2. Enable face detection and recognition
3. Restart WhoRang system
```

**3. Integration Reload Required**
```
Solution: Reload integration
Settings → Devices & Services → WhoRang → ⋮ → Reload
```

## WebSocket Issues

### WebSocket Connection Failures

**Symptoms:**
- Delayed notifications
- Entities update slowly
- "WebSocket disconnected" in logs

**Diagnosis:**

**1. Check WebSocket Endpoint**
```bash
# Test WebSocket connectivity
wscat -c ws://YOUR_WHORANG_IP:3001/ws
# Should connect without errors
```

**2. Network Configuration**
- Some networks block WebSocket connections
- Corporate firewalls often block WebSockets
- Try disabling WebSocket temporarily

**Solutions:**

**1. Disable WebSocket**
```
Settings → Devices & Services → WhoRang → Configure
Disable "Enable WebSocket"
Rely on polling instead
```

**2. Network Troubleshooting**
```bash
# Check for proxy/firewall interference
curl -H "Upgrade: websocket" -H "Connection: Upgrade" \
     http://YOUR_WHORANG_IP:3001/ws
```

**3. Alternative Network Path**
- Try different network route
- Use VPN if on corporate network
- Check router WebSocket support

## Performance Issues

### Slow Response Times

**Symptoms:**
- Long delays in notifications
- Slow entity updates
- High `sensor.whorang_ai_response_time`

**Diagnosis:**

**1. Check Response Time Sensor**
```yaml
# Monitor this sensor
sensor.whorang_ai_response_time
# Normal: < 2000ms (2 seconds)
# Slow: > 5000ms (5 seconds)
```

**2. System Resource Usage**
```bash
# Check WhoRang system resources
top
htop
# Look for high CPU/memory usage
```

**Solutions:**

**1. Optimize Update Interval**
```
Increase update interval to 60+ seconds
Enable WebSocket for real-time updates
Disable cost tracking if not needed
```

**2. AI Provider Optimization**
```yaml
# Switch to faster local provider
service: whorang.set_ai_provider
data:
  provider: "local"
```

**3. Network Optimization**
```
Use wired connection instead of WiFi
Reduce network traffic during peak hours
Check bandwidth limitations
```

### High Resource Usage

**Symptoms:**
- Home Assistant becomes slow
- High CPU/memory usage
- System instability

**Solutions:**

**1. Reduce Polling Frequency**
```
Increase update interval to 120+ seconds
Enable WebSocket to reduce polling
```

**2. Optimize Automations**
```yaml
# Add conditions to reduce triggers
condition:
  - condition: time
    after: "07:00:00"
    before: "23:00:00"
```

**3. Monitor Resource Usage**
```bash
# Check Home Assistant resources
docker stats homeassistant  # If using Docker
htop  # If using Core installation
```

## AI and Cost Issues

### Unexpected High Costs

**Symptoms:**
- `sensor.whorang_ai_cost_today` shows high values
- Unexpected AI provider bills
- Frequent AI analysis triggers

**Solutions:**

**1. Switch to Local Provider**
```yaml
service: whorang.set_ai_provider
data:
  provider: "local"
```

**2. Implement Cost Controls**
```yaml
automation:
  - alias: "Emergency Cost Stop"
    trigger:
      - platform: numeric_state
        entity_id: sensor.whorang_ai_cost_today
        above: 10.00
    action:
      - service: whorang.set_ai_provider
        data:
          provider: "local"
```

**3. Reduce Analysis Frequency**
- Disable automatic analysis
- Use manual triggers only
- Implement time-based restrictions

### AI Analysis Failures

**Symptoms:**
- No AI descriptions in visitor sensor
- Analysis button doesn't work
- Empty AI responses

**Diagnosis:**

**1. Check AI Provider Status**
```yaml
# Verify active provider
sensor.whorang_ai_provider_active

# Check if processing
binary_sensor.whorang_ai_processing
```

**2. Test Manual Analysis**
```yaml
# Try manual trigger
service: whorang.trigger_analysis
```

**Solutions:**

**1. Verify API Keys**
- Check AI provider API keys in WhoRang
- Ensure keys have sufficient credits
- Test keys directly with provider

**2. Switch Providers**
```yaml
# Try different provider
service: whorang.set_ai_provider
data:
  provider: "local"  # or "openai", "claude", etc.
```

**3. Check WhoRang Logs**
- Access WhoRang system logs
- Look for AI provider errors
- Verify network connectivity to AI services

## Mobile App Issues

### Notifications Not Received

**Symptoms:**
- No mobile notifications
- Delayed notifications
- Missing images in notifications

**Solutions:**

**1. Test Basic Notification**
```yaml
service: notify.mobile_app_your_phone
data:
  title: "Test"
  message: "Testing WhoRang notifications"
```

**2. Check Mobile App Settings**
- Ensure Home Assistant app notifications enabled
- Check Do Not Disturb settings
- Verify app permissions

**3. Image Delivery Issues**
```yaml
# Test without image first
service: notify.mobile_app_your_phone
data:
  title: "Test"
  message: "Test without image"
# If this works, image URL may be the issue
```

**4. Network Accessibility**
- Ensure mobile device can reach Home Assistant
- Check external URL configuration
- Verify SSL certificates if using HTTPS

## Error Messages Reference

### Common Error Messages

**"Cannot connect to WhoRang system"**
- Check network connectivity
- Verify IP address and port
- Ensure WhoRang is running

**"Invalid authentication"**
- Check API key configuration
- Try without API key
- Verify WhoRang security settings

**"Timeout error"**
- Increase timeout values
- Check network latency
- Verify system performance

**"WebSocket connection failed"**
- Disable WebSocket temporarily
- Check firewall settings
- Test WebSocket endpoint manually

**"Entity not available"**
- Check system status
- Restart integration
- Verify WhoRang connectivity

## Debug Mode

### Enable Debug Logging

**Add to configuration.yaml:**
```yaml
logger:
  default: info
  logs:
    custom_components.whorang: debug
    custom_components.whorang.api_client: debug
    custom_components.whorang.coordinator: debug
```

**Restart Home Assistant and check logs:**
```
Settings → System → Logs
Filter by: "whorang"
```

### Debug Information

**Debug logs include:**
- API request/response details
- WebSocket connection status
- Entity update cycles
- Error details and stack traces
- Performance metrics

**Analyzing debug logs:**
```
Look for patterns:
- Repeated connection failures
- Slow response times
- Authentication issues
- WebSocket disconnections
```

## Getting Help

### Before Asking for Help

**Gather this information:**
1. Home Assistant version
2. WhoRang integration version
3. WhoRang system version
4. Network configuration
5. Error messages from logs
6. Steps to reproduce the issue

### Support Channels

**GitHub Issues:**
- [WhoRang Issues](https://github.com/Beast12/who-rang/issues)
- Include debug logs and system information
- Search existing issues first

**Home Assistant Community:**
- [Community Forum](https://community.home-assistant.io/)
- Tag posts with "custom-integration"
- Include relevant configuration

**Documentation:**
- [Complete Documentation](../README.md)
- [Installation Guide](../installation.md)
- [Configuration Guide](../configuration/detailed-configuration.md)

### Creating Effective Bug Reports

**Include:**
1. **Environment Details**
   - Home Assistant version and installation type
   - WhoRang integration version
   - Operating system

2. **Problem Description**
   - What you expected to happen
   - What actually happened
   - When the problem started

3. **Steps to Reproduce**
   - Exact steps to trigger the issue
   - Configuration details
   - Any recent changes

4. **Logs and Evidence**
   - Relevant log entries
   - Screenshots if applicable
   - Configuration snippets

5. **Troubleshooting Attempted**
   - What you've already tried
   - Results of troubleshooting steps

## Prevention Tips

### Regular Maintenance

**Weekly:**
- Check system status sensors
- Review AI costs
- Test key automations

**Monthly:**
- Update integration via HACS
- Review and clean logs
- Backup configuration

**As Needed:**
- Monitor performance metrics
- Update WhoRang system
- Review security settings

### Best Practices

**Configuration:**
- Use reasonable update intervals
- Enable WebSocket for efficiency
- Implement cost monitoring
- Regular backups

**Monitoring:**
- Set up system health automations
- Monitor resource usage
- Track performance metrics
- Regular connectivity tests

**Security:**
- Use API keys when appropriate
- Regular key rotation
- Monitor access logs
- Keep systems updated

---

**Need more help?** Check our [complete documentation](../README.md) or [create an issue](https://github.com/Beast12/who-rang/issues) on GitHub.
