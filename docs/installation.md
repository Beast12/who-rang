# Installation Guide - WhoRang AI Doorbell Integration

Complete installation instructions for all Home Assistant installation types.

## Prerequisites

Before installing the WhoRang integration, ensure you have:

### Required
- **Home Assistant**: Version 2023.1 or newer
- **WhoRang Backend System**: Installed and running
- **Network Access**: Home Assistant can reach your WhoRang system

### Recommended
- **HACS**: For easy installation and updates
- **Mobile App**: For rich notifications with images

### Optional
- **AI Provider API Keys**: For cloud AI services (OpenAI, Claude, etc.)

## Installation Methods

### Method 1: HACS Installation (Recommended)

HACS provides the easiest installation and automatic updates.

#### Step 1: Install HACS (if not already installed)

If you don't have HACS installed:

1. Follow the [HACS installation guide](https://hacs.xyz/docs/setup/download)
2. Restart Home Assistant
3. Complete HACS setup through the UI

#### Step 2: Add WhoRang Repository

**[SCREENSHOT PLACEHOLDER: HACS Main Page]**
*Show: HACS sidebar menu with Integrations highlighted*

1. Open **HACS** from the Home Assistant sidebar
2. Click **Integrations**

**[SCREENSHOT PLACEHOLDER: HACS Integrations Page]**
*Show: HACS Integrations page with three-dot menu highlighted*

3. Click the **⋮** (three dots) menu in the top-right corner
4. Select **Custom repositories**

**[SCREENSHOT PLACEHOLDER: Custom Repository Dialog]**
*Show: Add custom repository dialog with fields filled*

5. In the dialog that opens:
   - **Repository**: `https://github.com/Beast12/who-rang`
   - **Category**: Select `Integration`
6. Click **Add**

#### Step 3: Install WhoRang Integration

**[SCREENSHOT PLACEHOLDER: HACS Search Results]**
*Show: HACS search showing WhoRang AI Doorbell integration*

1. In HACS Integrations, search for "WhoRang AI Doorbell"
2. Click on the **WhoRang AI Doorbell** integration
3. Click **Download**
4. Click **Download** again to confirm

**[SCREENSHOT PLACEHOLDER: Download Confirmation]**
*Show: Download confirmation dialog with version information*

5. **Restart Home Assistant** (required for new integrations)

#### Step 4: Verify Installation

After restart:

1. Go to **Settings** → **Devices & Services**
2. Click **Add Integration**
3. Search for "WhoRang AI Doorbell"
4. ✅ **Success**: The integration should appear in search results

### Method 2: Manual Installation

For advanced users or when HACS is not available.

#### Step 1: Download Integration Files

1. Go to the [WhoRang releases page](https://github.com/Beast12/who-rang/releases)
2. Download the latest release (e.g., `whorang-v1.0.0.zip`)
3. Extract the archive

#### Step 2: Copy Files to Home Assistant

**For Home Assistant OS/Supervised:**

1. Access your Home Assistant files via:
   - **File Editor** add-on
   - **Samba** add-on
   - **SSH & Web Terminal** add-on
   - **Studio Code Server** add-on

2. Navigate to your `config` directory
3. Create `custom_components` folder if it doesn't exist
4. Copy the `whorang` folder to `config/custom_components/`

**For Home Assistant Container (Docker):**

```bash
# Copy to your Home Assistant config directory
cp -r whorang /path/to/homeassistant/config/custom_components/
```

**For Home Assistant Core:**

```bash
# Copy to your Home Assistant config directory
cp -r whorang ~/.homeassistant/custom_components/
```

#### Step 3: Verify File Structure

Your directory structure should look like:

```
config/
└── custom_components/
    └── whorang/
        ├── __init__.py
        ├── manifest.json
        ├── const.py
        ├── config_flow.py
        ├── api_client.py
        ├── coordinator.py
        ├── sensor.py
        ├── binary_sensor.py
        ├── camera.py
        ├── button.py
        ├── select.py
        ├── device_tracker.py
        ├── services.yaml
        ├── strings.json
        └── translations/
            └── en.json
```

#### Step 4: Restart Home Assistant

Restart Home Assistant to load the new integration:

- **Home Assistant OS/Supervised**: Settings → System → Restart
- **Container**: Restart the container
- **Core**: Restart the service

## Installation Verification

### Check Integration is Available

1. Go to **Settings** → **Devices & Services**
2. Click **Add Integration**
3. Search for "WhoRang AI Doorbell"
4. ✅ **Success**: Integration appears in search results

### Check Logs for Errors

If the integration doesn't appear:

1. Go to **Settings** → **System** → **Logs**
2. Look for errors related to "whorang" or "custom_components"
3. Common issues:
   - Missing files
   - Incorrect file permissions
   - Python syntax errors

## Installation by Home Assistant Type

### Home Assistant OS

**Recommended**: HACS installation

**Manual Installation**:
1. Use **File Editor** add-on or **Samba** share
2. Navigate to `config/custom_components/`
3. Upload/copy the `whorang` folder
4. Restart via Settings → System → Restart

### Home Assistant Supervised

**Recommended**: HACS installation

**Manual Installation**:
1. Access files via add-ons (File Editor, SSH, etc.)
2. Copy files to `config/custom_components/whorang/`
3. Restart Home Assistant

### Home Assistant Container (Docker)

**HACS Installation**:
1. Ensure HACS is installed in your container
2. Follow standard HACS installation steps

**Manual Installation**:
```bash
# Stop container
docker stop homeassistant

# Copy files to config volume
docker cp whorang/ homeassistant:/config/custom_components/

# Start container
docker start homeassistant
```

**Docker Compose**:
```bash
# Copy files to your config directory
cp -r whorang /path/to/config/custom_components/

# Restart container
docker-compose restart homeassistant
```

### Home Assistant Core

**HACS Installation**:
1. Install HACS following their Python virtual environment guide
2. Follow standard HACS installation steps

**Manual Installation**:
```bash
# Copy to Home Assistant config directory
cp -r whorang ~/.homeassistant/custom_components/

# Restart Home Assistant service
sudo systemctl restart home-assistant@homeassistant
```

## Post-Installation Steps

### 1. Add the Integration

After installation and restart:

1. Go to **Settings** → **Devices & Services**
2. Click **Add Integration**
3. Search for "WhoRang AI Doorbell"
4. Follow the [Quick Start Guide](quick-start.md) for configuration

### 2. Configure Options (Optional)

After adding the integration:

1. Go to **Settings** → **Devices & Services**
2. Find "WhoRang AI Doorbell"
3. Click **Configure** to access options:
   - Update interval (10-300 seconds)
   - WebSocket enable/disable
   - Cost tracking enable/disable

### 3. Verify All Entities

Check that all 19 entities are created:

- 9 Sensors
- 5 Binary Sensors
- 1 Camera
- 3 Buttons
- 1 Select
- Dynamic Device Trackers

## Updating the Integration

### HACS Updates

1. HACS will notify you of available updates
2. Go to **HACS** → **Integrations**
3. Find "WhoRang AI Doorbell"
4. Click **Update**
5. Restart Home Assistant

### Manual Updates

1. Download the latest release
2. Replace files in `custom_components/whorang/`
3. Restart Home Assistant
4. Check changelog for breaking changes

## Troubleshooting Installation

### Integration Not Found

**Symptoms**: "WhoRang AI Doorbell" doesn't appear in Add Integration

**Solutions**:
1. ✅ Verify files are in correct location
2. ✅ Check file permissions (readable by HA user)
3. ✅ Restart Home Assistant completely
4. ✅ Check logs for Python errors

### HACS Repository Not Found

**Symptoms**: Cannot add custom repository

**Solutions**:
1. ✅ Verify repository URL: `https://github.com/Beast12/who-rang`
2. ✅ Check internet connectivity
3. ✅ Ensure HACS is properly installed
4. ✅ Try adding repository again

### Permission Errors

**Symptoms**: File permission errors in logs

**Solutions**:
```bash
# Fix permissions (adjust path as needed)
sudo chown -R homeassistant:homeassistant /config/custom_components/whorang/
sudo chmod -R 755 /config/custom_components/whorang/
```

### Python Import Errors

**Symptoms**: Import errors in logs

**Solutions**:
1. ✅ Verify all files are present
2. ✅ Check Home Assistant version (2023.1+ required)
3. ✅ Ensure no file corruption during copy
4. ✅ Re-download and reinstall

## Uninstalling

### Remove Integration

1. Go to **Settings** → **Devices & Services**
2. Find "WhoRang AI Doorbell"
3. Click **⋮** → **Delete**
4. Confirm deletion

### Remove Files

**HACS**: 
1. Go to **HACS** → **Integrations**
2. Find "WhoRang AI Doorbell"
3. Click **⋮** → **Remove**

**Manual**:
```bash
# Remove integration files
rm -rf /config/custom_components/whorang/
```

### Clean Restart

1. Restart Home Assistant
2. Check logs for any remaining references
3. Remove any remaining automations/dashboards using WhoRang entities

## Next Steps

After successful installation:

1. **[Quick Start Guide](quick-start.md)** - Get up and running in 5 minutes
2. **[Configuration Guide](configuration/detailed-configuration.md)** - Detailed setup options
3. **[Automation Examples](automation/automation-examples.md)** - Ready-to-use automations

## Support

- **Installation Issues**: [GitHub Issues](https://github.com/Beast12/who-rang/issues)
- **General Help**: [Home Assistant Community](https://community.home-assistant.io/)
- **Documentation**: [Complete Documentation](../README.md)
