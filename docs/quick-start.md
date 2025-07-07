# Quick Start Guide - WhoRang AI Doorbell Integration

**Get your WhoRang AI Doorbell working with Home Assistant in 5 minutes!**

This guide assumes you have:
- Home Assistant running (any installation type)
- WhoRang backend system installed and accessible
- Basic familiarity with Home Assistant interface

## Step 1: Install the Integration (2 minutes)

### Option A: HACS Installation (Recommended)

**[SCREENSHOT PLACEHOLDER: HACS Integration Page]**
*Show: HACS > Integrations page with search bar*

1. Open Home Assistant and go to **HACS** in the sidebar
2. Click **Integrations**
3. Click the **⋮** (three dots) menu in the top right
4. Select **Custom repositories**

**[SCREENSHOT PLACEHOLDER: Add Custom Repository Dialog]**
*Show: Dialog box with URL field and category dropdown*

5. Add this repository:
   - **Repository**: `https://github.com/Beast12/who-rang`
   - **Category**: `Integration`
6. Click **Add**

**[SCREENSHOT PLACEHOLDER: WhoRang in HACS Search]**
*Show: Search results showing "WhoRang AI Doorbell" integration*

7. Search for "WhoRang AI Doorbell"
8. Click **Download**
9. Click **Download** again to confirm
10. **Restart Home Assistant** (required)

### Option B: Manual Installation

1. Download the latest release from [GitHub releases](https://github.com/Beast12/who-rang/releases)
2. Extract the `whorang` folder to your `config/custom_components/` directory
3. Restart Home Assistant

## Step 2: Add the Integration (1 minute)

**[SCREENSHOT PLACEHOLDER: Home Assistant Settings Menu]**
*Show: Settings menu with "Devices & Services" highlighted*

1. Go to **Settings** → **Devices & Services**

**[SCREENSHOT PLACEHOLDER: Add Integration Button]**
*Show: Devices & Services page with "Add Integration" button in bottom right*

2. Click **Add Integration** (bottom right corner)

**[SCREENSHOT PLACEHOLDER: Integration Search]**
*Show: Search dialog with "WhoRang" typed in search box*

3. Search for "WhoRang AI Doorbell"
4. Click on the integration when it appears

## Step 3: Configure Connection (1 minute)

**[SCREENSHOT PLACEHOLDER: WhoRang Configuration Dialog]**
*Show: Configuration form with Host, Port, and API Key fields*

You'll see a configuration form. Fill in your WhoRang system details:

- **Host**: Your WhoRang system IP address (e.g., `192.168.1.100`)
- **Port**: Usually `3001` (default)
- **API Key**: Leave blank unless you've set one up

**What you should see**: The form should look like this:
```
Host: 192.168.1.100
Port: 3001
API Key: [leave blank]
```

Click **Submit**

**✅ Success**: You should see "Successfully configured WhoRang AI Doorbell"

**❌ If you get an error**:
- Check your WhoRang system is running
- Verify the IP address and port
- Make sure Home Assistant can reach your WhoRang system

## Step 4: Verify Entities (30 seconds)

**[SCREENSHOT PLACEHOLDER: WhoRang Device Page]**
*Show: Device page showing all 19 entities with their current states*

After successful configuration, you should see:

### ✅ What You Should See:
- **19 entities** created automatically
- **Sensors** showing visitor counts and system status
- **Binary sensors** for doorbell and motion detection
- **Camera** entity with latest image
- **Buttons** for manual controls
- **Device trackers** (if you have known persons set up)

### 🔍 Quick Check:
1. Go to **Settings** → **Devices & Services**
2. Find "WhoRang AI Doorbell" in your integrations
3. Click on it to see all entities
4. Check that `sensor.whorang_system_status` shows "online"

## Step 5: Add Your First Automation (30 seconds)

Let's create a simple doorbell notification:

**[SCREENSHOT PLACEHOLDER: Automation Editor]**
*Show: Automation editor with the doorbell automation being created*

1. Go to **Settings** → **Automations & Scenes**
2. Click **Create Automation**
3. Click **Start with an empty automation**
4. Copy and paste this automation:

```yaml
alias: "WhoRang Doorbell Notification"
description: "Get notified when someone rings the doorbell"
trigger:
  - platform: state
    entity_id: binary_sensor.whorang_doorbell
    to: "on"
action:
  - service: notify.persistent_notification
    data:
      title: "🔔 Doorbell"
      message: "{{ states('sensor.whorang_latest_visitor') }}"
```

5. Click **Save**
6. Give it a name: "WhoRang Doorbell Notification"

## Step 6: Test Everything (Verification)

### Test the Doorbell
1. Ring your doorbell (or trigger it manually)
2. **What you should see**:
   - `binary_sensor.whorang_doorbell` turns "on"
   - `sensor.whorang_latest_visitor` updates with visitor info
   - You get a notification in Home Assistant

### Check the Camera
1. Go to **Overview** in Home Assistant
2. Add a **Picture Entity** card
3. Select `camera.whorang_latest_image`
4. **What you should see**: Latest doorbell image

## 🎉 Success! You're Done!

Your WhoRang integration is now working! Here's what you have:

### ✅ Working Features:
- **Real-time doorbell notifications**
- **Visitor detection and AI analysis**
- **Latest doorbell images**
- **System health monitoring**
- **Ready for advanced automations**

## Next Steps (Optional)

### Add Mobile Notifications
Replace the notification service in your automation:

```yaml
action:
  - service: notify.mobile_app_your_phone  # Replace with your device
    data:
      title: "🔔 Doorbell"
      message: "{{ states('sensor.whorang_latest_visitor') }}"
      data:
        image: "/api/camera_proxy/camera.whorang_latest_image"
```

### Create a Dashboard
Add these cards to your dashboard:

```yaml
type: vertical-stack
cards:
  - type: picture-entity
    entity: camera.whorang_latest_image
    name: Latest Visitor
  - type: entities
    entities:
      - sensor.whorang_visitor_count_today
      - binary_sensor.whorang_doorbell
      - binary_sensor.whorang_system_online
```

### Explore More Features
- [Complete Entity Reference](usage/entities-guide.md)
- [15+ Automation Examples](automation/automation-examples.md)
- [Advanced Configuration](configuration/detailed-configuration.md)

## Troubleshooting

### Common Issues

**"Cannot connect to WhoRang system"**
- ✅ Check WhoRang is running: Visit `http://your-ip:3001` in a browser
- ✅ Verify IP address and port in configuration
- ✅ Check firewall settings

**"Entities not updating"**
- ✅ Check `sensor.whorang_system_status` shows "online"
- ✅ Try clicking `button.whorang_refresh_data`
- ✅ Check Home Assistant logs for errors

**"No doorbell notifications"**
- ✅ Test your doorbell manually
- ✅ Check `binary_sensor.whorang_doorbell` state changes
- ✅ Verify automation is enabled

### Get Help
- [Detailed Troubleshooting Guide](troubleshooting/common-issues.md)
- [GitHub Issues](https://github.com/Beast12/who-rang/issues)
- [Home Assistant Community](https://community.home-assistant.io/)

---

**🎯 Goal Achieved**: You now have a working AI-powered doorbell integration with Home Assistant!

**⏱️ Total Time**: ~5 minutes
**✅ Status**: Ready for advanced automations and customization
