# WhoRang Integration Memory Bank Update

## Project Context
- **Project**: WhoRang AI Doorbell Home Assistant Integration
- **Repository**: door-scribe-ai-view
- **Integration Path**: `custom_components/whorang/`
- **Purpose**: Home Assistant custom component for WhoRang AI doorbell system

## Recent Critical Fixes Implemented (January 7, 2025)

### 1. SSL Blocking Operations Fix
**Issue**: SSL context creation was blocking the event loop
**Files Modified**: `custom_components/whorang/api_client.py`
**Solution**: 
- Moved SSL context creation from async `_get_session()` to synchronous `__init__()`
- Added `_create_ssl_context()` method for proper SSL setup
- Pre-created SSL context stored in `self._ssl_context`

**Key Code Pattern**:
```python
def __init__(self, ...):
    if self.use_ssl:
        self._ssl_context = self._create_ssl_context()

def _create_ssl_context(self) -> ssl.SSLContext:
    ssl_context = ssl.create_default_context()
    if not self.verify_ssl:
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
    return ssl_context
```

### 2. API Response Format Robustness
**Issue**: Integration failed with "list object has no attribute 'get'" errors
**Files Modified**: `custom_components/whorang/api_client.py`
**Solution**:
- Enhanced `get_known_persons()` with multiple response format support
- Added fallback mechanisms for AI usage stats across multiple endpoints
- Implemented graceful error handling with sensible defaults

**Key Code Pattern**:
```python
async def get_known_persons(self) -> List[Dict[str, Any]]:
    response = await self._request("GET", API_FACES_PERSONS)
    
    if isinstance(response, dict):
        return (response.get("data") or 
               response.get("persons") or 
               response.get("known_persons") or [])
    elif isinstance(response, list):
        return response
    else:
        return []
```

### 3. Entity Configuration Fix
**Issue**: Invalid state class for monetary device class
**Files Modified**: `custom_components/whorang/sensor.py`
**Solution**: Changed AI cost sensor state class from `STATE_CLASS_TOTAL_INCREASING` to `STATE_CLASS_TOTAL`

### 4. WebSocket SSL Support
**Issue**: WebSocket connections failing with HTTP 400 for HTTPS deployments
**Files Modified**: `custom_components/whorang/coordinator.py`
**Solution**:
- Added proper WebSocket URL construction with SSL support
- Enhanced connection with SSL context sharing from API client
- Added authentication header support

**Key Code Pattern**:
```python
def _build_websocket_url(self) -> str:
    scheme = "wss" if self.api_client.use_ssl else "ws"
    # Handle standard ports and construct proper URL

async def _websocket_handler(self) -> None:
    connect_kwargs = {"timeout": DEFAULT_WEBSOCKET_TIMEOUT}
    if self.api_client.use_ssl and self.api_client._ssl_context:
        connect_kwargs["ssl"] = self.api_client._ssl_context
    if self.api_client.api_key:
        connect_kwargs["extra_headers"] = {"Authorization": f"Bearer {self.api_key}"}
```

## Integration Icon Investigation and Resolution (January 7, 2025)

### 5. Home Assistant Integration Icon Issue - Root Cause Analysis
**Issue**: WhoRang integration showed generic placeholder icon instead of WhoRang logo
**Initial Attempts**: Multiple approaches tried and failed
**Root Cause Discovered**: Custom integrations CANNOT use local icon files or manifest.json icon fields

**Comprehensive Investigation**:
- Tested local icon.png files in integration directory (failed)
- Tested MDI icons in manifest.json ("mdi:doorbell-video", "mdi:home") (failed)
- Tested cache clearing, version bumping, container restarts (failed)
- Researched Home Assistant developer documentation
- Analyzed Home Assistant Community forum discussions (2020-2025)
- Verified technical behavior with curl testing

**Definitive Finding**:
Home Assistant hardcodes integration icon URLs to: `https://brands.home-assistant.io/{domain}/icon.png`
- Custom integrations cannot override this behavior
- Manifest.json icon fields are completely ignored for custom integrations
- Local icon files are never used by Home Assistant's frontend

**Technical Verification**:
```bash
# Confirmed 404 error for WhoRang icon
curl -I https://brands.home-assistant.io/whorang/icon.png
# Returns: HTTP/2 404 - File not found
```

**Solution Implemented**:
- Removed non-functional icon field from manifest.json
- Cleaned up integration to eliminate confusion
- Documented architectural limitation
- Prepared files for brands repository submission

**Files Created for Future Brands Repository Submission**:
- `whorang_brand_icon.png` (256x256, 44.0 KB) - Optimized for submission
- `whorang_brand_icon@2x.png` (512x512, 43.0 KB) - High-DPI version

**Updated Manifest.json**:
```json
{
  "domain": "whorang",
  "name": "WhoRang AI Doorbell",
  "version": "1.0.3"
  // Removed non-functional "icon" field
}
```

**Key Learning**:
This is an architectural limitation of Home Assistant's custom integration system, not a configuration issue. The only way to get integration-level icons is through the official Home Assistant brands repository submission process.

**Alternative Solutions Available**:
1. **Brands Repository Submission** - Submit to `https://github.com/home-assistant/brands`
2. **Entity-Level Icons** - Add icons to individual entities in code
3. **Accept Limitation** - Use placeholder icons (current state)

## URL Configuration Enhancement (Previous Implementation)

### Flexible URL Input System
**Files Modified**: 
- `custom_components/whorang/config_flow.py`
- `custom_components/whorang/api_client.py`
- `custom_components/whorang/const.py`
- `custom_components/whorang/strings.json`

**Key Features**:
- Single URL field instead of separate host/port
- Smart URL parsing supporting multiple formats
- HTTPS/SSL support with configurable verification
- Backward compatibility with existing configurations

**URL Parsing Logic**:
```python
def parse_whorang_url(url_input: str) -> Tuple[str, int, bool]:
    # Handles: https://api-doorbell.tuxito.be, 192.168.1.100:3001, etc.
    # Returns: (host, port, use_ssl)
```

## Architecture Patterns Established

### 1. SSL Context Management
- **Pattern**: Create SSL context synchronously during initialization
- **Rationale**: Avoids event loop blocking in async methods
- **Implementation**: Store in `self._ssl_context` for reuse

### 2. API Response Handling
- **Pattern**: Defensive programming with multiple format support
- **Rationale**: Handle various API versions and response structures
- **Implementation**: Check response type and extract data with fallbacks

### 3. WebSocket Connection Management
- **Pattern**: Protocol-aware URL construction with SSL context sharing
- **Rationale**: Ensure WebSocket connections work with both HTTP and HTTPS
- **Implementation**: Dynamic scheme selection and SSL context reuse

### 4. Error Handling Strategy
- **Pattern**: Graceful degradation with sensible defaults
- **Rationale**: Keep integration functional even when some endpoints fail
- **Implementation**: Try multiple endpoints, return default values on failure

### 5. Integration Asset Management
- **Pattern**: Optimized asset placement following Home Assistant conventions
- **Rationale**: Ensure proper branding and professional appearance
- **Implementation**: Auto-detected icon.png with optimized specifications

## Configuration Schema Evolution

### Current Schema (Post-Fix)
```python
STEP_USER_DATA_SCHEMA = vol.Schema({
    vol.Required(CONF_URL, description="WhoRang URL"): str,
    vol.Optional(CONF_API_KEY, description="API Key (optional)"): str,
    vol.Optional(CONF_VERIFY_SSL, default=True): bool,
})
```

### Supported URL Formats
- `https://api-doorbell.tuxito.be` (HTTPS with default port 443)
- `https://mydomain.com:8443` (HTTPS with custom port)
- `http://192.168.1.100:3001` (HTTP with custom port)
- `192.168.1.100:3001` (Legacy IP:port format)
- `mydomain.com` (Auto-HTTPS detection)

## API Client Architecture

### Enhanced Constructor
```python
def __init__(self, host: str, port: int, use_ssl: bool = False, 
             api_key: Optional[str] = None, verify_ssl: bool = True):
    # SSL context creation
    # Base URL construction
    # Session management setup
```

### Session Management
- Pre-created SSL context for performance
- Proper session lifecycle with cleanup
- SSL context sharing between HTTP and WebSocket

### Error Handling Hierarchy
1. **Connection Errors**: Network-level issues
2. **Authentication Errors**: API key problems
3. **API Errors**: Server-side issues
4. **Format Errors**: Response parsing issues

## Testing Patterns

### URL Parsing Tests
- Comprehensive test suite in `test_url_parsing_standalone.py`
- Covers all supported URL formats
- Validates error handling for invalid inputs

### Connection Testing
- SSL connection validation
- API endpoint verification
- WebSocket connectivity testing

### Icon Integration Testing
- Visual verification in Home Assistant UI
- File size and format validation
- Cross-theme compatibility testing

## Deployment Considerations

### Production HTTPS Deployments
- SSL verification enabled by default
- Proper certificate validation
- WebSocket over SSL (wss://)
- Optimized integration assets

### Development/Testing
- SSL verification can be disabled
- Self-signed certificate support
- Enhanced debugging and logging

## Known Issues and Limitations

### Current Limitations
- WebSocket endpoint discovery not implemented
- API version detection not automated
- Limited load balancing support

### Future Enhancement Opportunities
- Automatic endpoint discovery
- API version compatibility checking
- Enhanced monitoring and diagnostics
- Multi-backend support
- Further icon optimization (target <50KB)

## Integration Dependencies

### Required Home Assistant Components
- `homeassistant.components.sensor`
- `homeassistant.helpers.update_coordinator`
- `homeassistant.config_entries`

### External Dependencies
- `aiohttp` for HTTP client
- `websockets` for real-time updates
- `ssl` for secure connections

### Development Dependencies
- `Pillow` for image processing and optimization

## Debugging and Troubleshooting

### Common Issues and Solutions
1. **SSL Blocking Warnings**: Fixed with synchronous SSL context creation
2. **API Format Errors**: Fixed with robust response parsing
3. **WebSocket 400 Errors**: Fixed with proper URL construction and SSL support
4. **Entity Configuration Warnings**: Fixed with proper state class selection
5. **Missing Integration Icon**: Fixed with optimized icon.png placement

### Logging Strategy
- Debug level for connection details
- Info level for significant events
- Warning level for recoverable issues
- Error level for critical failures

## Code Quality Standards

### Established Patterns
- Type hints throughout
- Comprehensive error handling
- Defensive programming practices
- Clear separation of concerns
- Optimized asset management

### Documentation Standards
- Docstrings for all public methods
- Inline comments for complex logic
- Architecture decision records
- User-facing documentation updates

## Integration Branding Standards

### Visual Identity Requirements
- Consistent WhoRang logo usage across all UI elements
- Optimized file sizes for fast loading
- Transparency support for theme compatibility
- Clear visibility at multiple display sizes

### Asset Optimization Guidelines
- PNG format with RGBA transparency
- 512x512 pixel resolution for integration icons
- Target file size under 50KB (current: 228KB)
- Color quantization for size optimization while maintaining quality

This memory bank update captures the current state of the WhoRang integration with all recent critical fixes, architectural improvements, the new integration icon implementation, and the comprehensive API key configuration system with backend API fixes.
