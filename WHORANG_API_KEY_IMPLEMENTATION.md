# WhoRang API Key Configuration Implementation

## Overview

This document describes the implementation of API key configuration functionality for the WhoRang Home Assistant integration, enabling support for external AI providers (OpenAI, Claude, Gemini, Google Cloud Vision) that require authentication.

## Implementation Summary

### Files Modified

1. **`custom_components/whorang/config_flow.py`**
   - Added AI provider configuration step in setup flow
   - Implemented API key validation for all supported providers
   - Enhanced options flow with menu-based navigation
   - Added comprehensive API key testing methods

2. **`custom_components/whorang/api_client.py`**
   - Added `set_ai_provider_with_key()` method for authenticated provider switching
   - Added `get_available_providers()` method for provider capability discovery
   - Enhanced API client to handle external provider authentication

3. **`custom_components/whorang/select.py`**
   - Modified AI provider select entity to show only providers with configured API keys
   - Added dynamic options list based on available API keys
   - Enhanced provider switching with automatic API key passing

4. **`custom_components/whorang/coordinator.py`**
   - Updated `async_set_ai_provider()` to support API key parameter
   - Enhanced provider switching logic for external providers

5. **`custom_components/whorang/strings.json`**
   - Added UI text for AI provider configuration step
   - Added options flow menu and AI provider management
   - Added error messages for API key validation

## Key Features Implemented

### 1. Enhanced Configuration Flow

**AI Provider Configuration Step:**
- Added after initial WhoRang system connection
- Optional API key configuration for external providers
- Real-time API key validation before storage
- User-friendly error handling and guidance

**Configuration Data Structure:**
```python
config_entry.data = {
    "host": "api-doorbell.tuxito.be",
    "port": 443,
    "use_ssl": True,
    "verify_ssl": True,
    "api_key": "whorang_api_key",
    "url": "https://api-doorbell.tuxito.be",
    "ai_api_keys": {
        "openai_api_key": "sk-...",
        "claude_api_key": "sk-ant-...",
        "gemini_api_key": "AI...",
        "google_cloud_api_key": "AI..."
    }
}
```

### 2. API Key Validation System

**Validation Methods:**
- **OpenAI**: Tests against `/v1/models` endpoint
- **Claude**: Tests against `/v1/messages` endpoint with minimal request
- **Gemini**: Tests against Google AI Studio API models endpoint
- **Google Cloud Vision**: Tests against Vision API with empty image request

**Validation Features:**
- Asynchronous validation with 10-second timeout
- Comprehensive error handling and logging
- User-friendly error messages for invalid keys
- Graceful handling of network issues

### 3. Options Flow Enhancement

**Menu-Based Navigation:**
- General options (update interval, WebSocket, cost tracking)
- AI provider API key management
- Real-time configuration updates without restart

**API Key Management:**
- Update existing API keys
- Add new API keys
- Remove API keys (by leaving fields empty)
- Immediate validation and feedback

### 4. Smart AI Provider Selection

**Dynamic Provider List:**
- Local provider always available (no API key required)
- External providers only shown when API keys are configured
- Real-time updates when API keys are modified
- Clear indication of available vs unavailable providers

**Provider Switching Logic:**
```python
# Automatic API key retrieval and passing
key_mapping = {
    "openai": "openai_api_key",
    "claude": "claude_api_key", 
    "gemini": "gemini_api_key",
    "google-cloud-vision": "google_cloud_api_key"
}
api_key = api_keys.get(key_mapping.get(option))
success = await self.coordinator.api_client.set_ai_provider_with_key(option, api_key)
```

### 5. Enhanced API Client

**New Methods:**
- `set_ai_provider_with_key(provider, api_key)`: Set provider with authentication
- `get_available_providers()`: Get provider capabilities and requirements

**Authentication Handling:**
- Secure API key passing to WhoRang backend
- Fallback mechanisms for provider switching failures
- Comprehensive error handling and logging

## User Experience Flow

### Initial Setup
1. User enters WhoRang system URL and connection details
2. System validates connection to WhoRang
3. User presented with AI provider configuration (optional)
4. User can enter API keys for desired external providers
5. System validates API keys before storing
6. Integration created with configured providers available

### Ongoing Management
1. User accesses integration options
2. User selects "AI Providers" from menu
3. User can update/add/remove API keys
4. System validates changes immediately
5. Provider selection updates automatically

### Provider Selection
1. AI Provider select entity shows only available providers
2. Local provider always available
3. External providers only shown if API keys configured
4. Switching automatically uses appropriate API key
5. Real-time feedback on switching success/failure

## Security Considerations

### API Key Storage
- API keys stored in Home Assistant's encrypted configuration storage
- No API keys exposed in logs or debug output
- Secure transmission to WhoRang backend

### Validation Security
- API key validation uses minimal requests to avoid costs
- Timeout protection prevents hanging requests
- Error handling prevents information leakage

### Network Security
- HTTPS used for all external API validation requests
- SSL context properly configured for secure connections
- Proper error handling for network failures

## Error Handling

### Configuration Errors
- Invalid API key format detection
- Network connectivity issues during validation
- Clear user feedback for all error conditions

### Runtime Errors
- Graceful fallback when API keys become invalid
- Automatic retry mechanisms for transient failures
- Comprehensive logging for troubleshooting

### User Feedback
- Clear error messages with actionable guidance
- Links to API key generation pages
- Status indication for provider availability

## Backward Compatibility

### Existing Configurations
- Existing integrations continue to work without modification
- Graceful handling of missing API key configuration
- Smooth upgrade path for existing users

### Migration Path
- No breaking changes to existing functionality
- Optional API key configuration preserves existing behavior
- Clear upgrade instructions for enhanced functionality

## Testing Considerations

### API Key Validation Testing
- Test with valid API keys for all providers
- Test with invalid API keys
- Test with network connectivity issues
- Test timeout handling

### Configuration Flow Testing
- Test initial setup with and without API keys
- Test options flow API key management
- Test configuration updates and validation

### Provider Selection Testing
- Test dynamic provider list updates
- Test provider switching with API keys
- Test fallback to local provider

## Future Enhancements

### Potential Improvements
1. **Bulk API Key Import**: Support for importing multiple API keys from file
2. **API Key Rotation**: Automatic handling of API key rotation
3. **Usage Monitoring**: Track API usage per provider
4. **Cost Estimation**: Provide cost estimates for different providers
5. **Provider Health Monitoring**: Monitor provider availability and performance

### Extensibility
- Framework supports easy addition of new AI providers
- Modular validation system for different authentication methods
- Configurable provider capabilities and requirements

## Conclusion

The API key configuration implementation transforms the WhoRang integration from a local-only solution to a fully-featured AI doorbell system supporting all major AI providers. The implementation prioritizes security, user experience, and maintainability while providing comprehensive functionality for managing external AI provider authentication.

Key benefits:
- ✅ Secure API key management
- ✅ User-friendly configuration experience
- ✅ Dynamic provider availability
- ✅ Comprehensive validation and error handling
- ✅ Backward compatibility
- ✅ Extensible architecture for future enhancements

This implementation enables users to leverage the full power of external AI providers while maintaining the security and reliability expected from a Home Assistant integration.
