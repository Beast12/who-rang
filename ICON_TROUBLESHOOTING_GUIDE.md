# WhoRang Integration Icon Troubleshooting Guide

## Current Status
- ✅ Icon files created: `icon.png` (43.0 KB) and `icon@2x.png` (38.5 KB)
- ✅ Files are properly sized (512x512 and 256x256)
- ✅ Files are under 50KB recommendation
- ✅ PNG format with RGBA transparency
- ✅ Integration version bumped to 1.0.1
- ❌ Icons still not appearing in Home Assistant UI

## Home Assistant Icon Cache Issues

Home Assistant aggressively caches integration icons. The following steps are required to force icon refresh:

### Step 1: Complete Integration Removal
```bash
# Remove the integration completely from Home Assistant
# Go to Settings → Devices & Services → WhoRang → Delete
```

### Step 2: Clear Home Assistant Cache
```bash
# Restart Home Assistant to clear icon cache
docker restart homeassistant-dev

# Alternative: Clear browser cache and hard refresh (Ctrl+F5)
```

### Step 3: Copy Updated Integration
```bash
# Copy the updated integration with new version and icon
docker cp custom_components/whorang homeassistant-dev:/config/custom_components/

# Verify files are copied correctly
docker exec homeassistant-dev ls -la /config/custom_components/whorang/icon*
```

### Step 4: Restart Home Assistant Again
```bash
# Full restart to reload integration with new version
docker restart homeassistant-dev
```

### Step 5: Re-add Integration
1. Wait for Home Assistant to fully start
2. Go to Settings → Devices & Services
3. Click "Add Integration"
4. Search for "WhoRang"
5. The icon should now appear

## Alternative Solutions

### Option 1: Browser Cache Clear
- Clear browser cache completely
- Use incognito/private browsing mode
- Hard refresh with Ctrl+F5 or Cmd+Shift+R

### Option 2: Different Icon Format
If the current approach doesn't work, try:
- Creating a simpler icon with fewer colors
- Using a different image optimization approach
- Creating icons in multiple sizes (128x128, 256x256, 512x512)

### Option 3: Explicit Icon Reference
Some integrations require explicit icon references in manifest.json:
```json
{
  "domain": "whorang",
  "name": "WhoRang AI Doorbell",
  "icon": "mdi:doorbell-video",
  ...
}
```

## Verification Steps

After following the troubleshooting steps:

1. **Integration Search**: Search for "WhoRang" - should show WhoRang logo
2. **Device Page**: Go to device page - should show WhoRang logo in header
3. **Integration List**: Check Settings → Devices & Services - should show logo

## Technical Details

### Current Icon Specifications
- **File**: `custom_components/whorang/icon.png`
- **Size**: 512x512 pixels
- **Format**: PNG with RGBA transparency
- **File Size**: 43.0 KB (under 50KB recommendation)
- **Color Depth**: 16 colors (optimized for size)

### Alternative Icon
- **File**: `custom_components/whorang/icon@2x.png`
- **Size**: 256x256 pixels
- **File Size**: 38.5 KB

### Integration Version
- **Previous**: 1.0.0
- **Current**: 1.0.1 (bumped to force refresh)

## Common Issues and Solutions

### Issue: Icon Still Not Appearing
**Cause**: Home Assistant icon cache not cleared
**Solution**: Complete integration removal and re-addition

### Issue: Generic "WhoR" Icon
**Cause**: Home Assistant using text fallback instead of icon
**Solution**: Ensure icon.png is exactly 512x512 and under 50KB

### Issue: Icon Appears Blurry
**Cause**: Over-optimization reducing image quality
**Solution**: Balance between file size and quality

## Next Steps

If icons still don't appear after following all steps:
1. Check Home Assistant logs for icon-related errors
2. Try creating a minimal test icon (solid color square)
3. Compare with other working custom integrations
4. Consider using MDI icon reference as fallback

## Files Modified
- `custom_components/whorang/icon.png` - Main integration icon
- `custom_components/whorang/icon@2x.png` - Alternative size icon
- `custom_components/whorang/manifest.json` - Version bumped to 1.0.1
