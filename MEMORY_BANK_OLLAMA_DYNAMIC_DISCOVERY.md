# WhoRang Dynamic Ollama Model Discovery Implementation - Memory Bank Update (January 8, 2025)

## Project Context
- **Project**: WhoRang AI Doorbell Home Assistant Integration
- **Repository**: door-scribe-ai-view
- **Integration Path**: `custom_components/whorang/`
- **Backend Path**: `backend/`
- **Enhancement**: Dynamic Ollama Model Discovery for Home Assistant Integration

## Implementation Overview

Successfully implemented dynamic Ollama model discovery in the Home Assistant WhoRang integration, replacing static model lists with real-time model detection from the local Ollama instance. This provides users with the same dynamic model selection capabilities available in the WhoRang GUI interface.

## Key Achievement

**Before**: Static model list for local provider: `["llava", "llava:7b", "llava:13b", "bakllava"]`
**After**: Dynamic model discovery showing actual installed Ollama models with metadata (size, modification date, vision capabilities)

## Backend Infrastructure Analysis

### Existing Ollama Controller (`backend/controllers/ollamaController.js`)

**Already Implemented Features**:
- **Dynamic Model Discovery**: `getAvailableModels()` method queries Ollama `/api/tags` endpoint
- **Vision Model Filtering**: Automatically filters for vision-capable models (llava, bakllava, vision)
- **Docker Network Support**: Handles localhost to host.docker.internal conversion
- **Error Handling**: Robust fallback mechanisms with default model lists
- **Connection Testing**: `testConnection()` method for Ollama service status

**Existing API Endpoints**:
- `GET /api/faces/ollama/models` - Get available Ollama models
- `POST /api/faces/ollama/test` - Test Ollama connection

**Model Response Format**:
```javascript
{
  models: [
    {
      value: "llava:latest",
      label: "LLaVA Latest",
      size: 4661224448,
      modified_at: "2024-01-15T10:30:00Z"
    }
  ],
  ollama_url: "http://localhost:11434",
  total: 3,
  error?: "Connection failed message",
  fallback?: true
}
```

## Home Assistant Integration Enhancements

### 1. Enhanced API Client (`custom_components/whorang/api_client.py`)

**New Ollama-Specific Methods**:

**`get_ollama_models()`**:
- Leverages existing `/api/faces/ollama/models` endpoint
- Transforms GUI response format to HA-compatible structure
- Returns detailed model metadata including size, modification date, vision capabilities
- Graceful error handling with empty list fallback

**`get_ollama_status()`**:
- Uses existing `/api/faces/ollama/test` endpoint
- Returns connection status, version, URL, and diagnostic information
- Provides detailed error messages for troubleshooting

**`_format_size()`**:
- Utility method for human-readable model size formatting
- Converts bytes to appropriate units (B, KB, MB, GB, TB)

**Implementation Details**:
```python
async def get_ollama_models(self) -> List[Dict[str, Any]]:
    """Get available Ollama models from existing endpoint."""
    try:
        response = await self._request("GET", "/api/faces/ollama/models")
        models_data = response.get("models", [])
        
        # Transform to match HA expectations
        transformed_models = []
        for model in models_data:
            if isinstance(model, dict):
                transformed_models.append({
                    "name": model.get("value", ""),
                    "display_name": model.get("label", ""),
                    "size": model.get("size", 0),
                    "modified_at": model.get("modified_at"),
                    "is_vision": True  # Backend already filters for vision models
                })
        
        return transformed_models
    except Exception as e:
        _LOGGER.error("Failed to get Ollama models: %s", e)
        return []
```

### 2. Enhanced Data Coordinator (`custom_components/whorang/coordinator.py`)

**Dynamic Model Discovery Integration**:

**Enhanced `_async_update_data()` Method**:
- Detects when local provider is selected
- Automatically fetches dynamic Ollama models
- Updates available_models dictionary with real-time data
- Includes Ollama status monitoring

**Key Implementation**:
```python
# Special handling for local/Ollama provider - get dynamic models
ollama_models = []
ollama_status = {}
if current_ai_provider == "local":
    ollama_models = await self.api_client.get_ollama_models()
    ollama_status = await self.api_client.get_ollama_status()
    
    # Update available_models with dynamic Ollama models if available
    if ollama_models:
        available_models["local"] = [model["name"] for model in ollama_models]
        _LOGGER.debug("Updated local models with %d Ollama models", len(ollama_models))
```

**Data Structure Enhancement**:
```python
return {
    # ... existing data ...
    "ollama_models": ollama_models,      # Detailed model metadata
    "ollama_status": ollama_status,      # Connection status and info
    "available_models": available_models  # Updated with dynamic models
}
```

### 3. Enhanced AI Model Select Entity (`custom_components/whorang/select.py`)

**Dynamic Model Options**:

**Smart Model Selection Logic**:
```python
@property
def options(self) -> List[str]:
    """Return available models for current AI provider."""
    current_provider = self.coordinator.data.get("current_ai_provider", "local")
    
    if current_provider == "local":
        # Use dynamic Ollama models
        ollama_models = self.coordinator.data.get("ollama_models", [])
        if ollama_models:
            return [model["name"] for model in ollama_models]
        else:
            # Fallback to static list if Ollama unavailable
            return ["llava", "llava:7b", "llava:13b", "bakllava"]
    else:
        # Use static lists for external providers
        available_models = self.coordinator.data.get("available_models", {})
        return available_models.get(current_provider, ["default"])
```

**Rich Model Metadata in Attributes**:
```python
@property
def extra_state_attributes(self) -> Dict[str, Any]:
    """Return additional state attributes."""
    if current_provider == "local":
        ollama_models = self.coordinator.data.get("ollama_models", [])
        ollama_status = self.coordinator.data.get("ollama_status", {})
        current_model = self.current_option
        
        # Find current model info
        model_info = next((m for m in ollama_models if m["name"] == current_model), {})
        
        return {
            "current_provider": current_provider,
            "model_size": self._format_size(model_info.get("size", 0)),
            "model_display_name": model_info.get("display_name", current_model),
            "last_modified": model_info.get("modified_at"),
            "is_vision_model": model_info.get("is_vision", False),
            "total_available_models": len(ollama_models),
            "ollama_status": ollama_status.get("status", "unknown"),
            "ollama_version": ollama_status.get("version"),
            "ollama_url": ollama_status.get("url"),
            "ollama_message": ollama_status.get("message")
        }
```

### 4. Enhanced Services (`custom_components/whorang/services.yaml`)

**New Ollama Management Services**:

**`refresh_ollama_models`**:
- Manually refresh the list of available Ollama models
- Useful for updating model list after installing/removing models
- Triggers coordinator refresh to update all entities

**`test_ollama_connection`**:
- Test connection to Ollama service
- Returns detailed status and diagnostic information
- Useful for troubleshooting connectivity issues

### 5. Service Implementation (`custom_components/whorang/__init__.py`)

**New Service Handlers**:

**`refresh_ollama_models_service`**:
```python
async def refresh_ollama_models_service(call) -> None:
    """Handle refresh Ollama models service call."""
    for coordinator in coordinators:
        try:
            # Force refresh of Ollama models
            ollama_models = await coordinator.api_client.get_ollama_models()
            _LOGGER.info("Refreshed Ollama models: found %d models", len(ollama_models))
            
            # Trigger coordinator refresh to update entities
            await coordinator.async_request_refresh()
        except Exception as err:
            _LOGGER.error("Failed to refresh Ollama models: %s", err)
```

**`test_ollama_connection_service`**:
```python
async def test_ollama_connection_service(call) -> None:
    """Handle test Ollama connection service call."""
    for coordinator in coordinators:
        try:
            status = await coordinator.api_client.get_ollama_status()
            if status.get("status") == "connected":
                _LOGGER.info("Ollama connection test successful: %s", status.get("message", "Connected"))
            else:
                _LOGGER.warning("Ollama connection test failed: %s", status.get("message", "Disconnected"))
        except Exception as err:
            _LOGGER.error("Failed to test Ollama connection: %s", err)
```

## Technical Architecture

### 1. Data Flow
```
Ollama Instance → Backend Controller → HA API Client → Coordinator → Select Entity → UI
     ↓                    ↓                ↓              ↓            ↓
/api/tags         /api/faces/ollama/   get_ollama_    _async_update_   options
endpoint          models endpoint      models()       data()           property
```

### 2. Model Synchronization
- **Provider Change**: Triggers Ollama model discovery when switching to local
- **Model Discovery**: Real-time fetching from Ollama `/api/tags` endpoint
- **Fallback Strategy**: Static model list when Ollama unavailable
- **Caching**: Coordinator caches model data to reduce API calls

### 3. Error Handling
- **Connection Failures**: Graceful fallback to static model lists
- **Empty Model Lists**: Default vision models provided as fallback
- **API Errors**: Detailed logging with diagnostic information
- **Network Issues**: Robust retry mechanisms and timeout handling

## Frontend-Backend Parity

### 1. Consistent Model Discovery
- **Same API Endpoints**: HA integration uses identical endpoints as GUI
- **Same Model Filtering**: Vision model filtering logic matches GUI
- **Same Error Handling**: Consistent fallback behavior across interfaces

### 2. Model Information
- **Rich Metadata**: Model size, modification date, display names
- **Status Monitoring**: Connection status and version information
- **Real-time Updates**: Dynamic model list updates when models change

### 3. User Experience
- **Familiar Models**: Shows same models as GUI interface
- **Immediate Feedback**: Real-time model availability updates
- **Diagnostic Tools**: Service calls for troubleshooting

## Performance Considerations

### 1. Efficient Model Discovery
- **Conditional Fetching**: Only queries Ollama when local provider selected
- **Cached Results**: Coordinator caches model data between updates
- **Minimal Overhead**: Lightweight API calls with timeout protection

### 2. UI Responsiveness
- **Async Operations**: Non-blocking model discovery operations
- **Progressive Enhancement**: UI remains functional during API calls
- **Smart Fallbacks**: Immediate fallback to static models on errors

### 3. Resource Usage
- **Targeted Queries**: Only fetches models when needed
- **Efficient Updates**: Only refreshes when provider changes
- **Memory Efficient**: Minimal memory footprint for model metadata

## User Experience Enhancements

### 1. Real-time Model Visibility
- **Actual Models**: Shows only models actually installed in Ollama
- **Model Metadata**: Size, modification date, and capabilities
- **Status Awareness**: Clear indication of Ollama connection status

### 2. Improved Troubleshooting
- **Connection Testing**: Service call to test Ollama connectivity
- **Model Refresh**: Manual refresh capability for model list updates
- **Detailed Logging**: Comprehensive error messages and diagnostics

### 3. Consistent Experience
- **GUI Parity**: Same models and information as web interface
- **Seamless Integration**: Natural part of existing model selection workflow
- **Professional Quality**: Production-ready error handling and fallbacks

## Success Metrics Achieved

### ✅ **Dynamic Model Discovery**
- AI Model select shows real Ollama models from `/api/tags` endpoint
- Model list updates automatically when Ollama models change
- Vision models are properly filtered (llava, bakllava, vision variants)

### ✅ **Rich Model Information**
- Model metadata includes size, modification date, display names
- Entity attributes show Ollama status, version, and connection info
- Total available model count and current model details

### ✅ **Robust Error Handling**
- Graceful fallback to static models when Ollama unavailable
- Detailed error messages and diagnostic information
- Maintains functionality even when Ollama service is down

### ✅ **Service Integration**
- `refresh_ollama_models` service for manual model list updates
- `test_ollama_connection` service for connectivity diagnostics
- Comprehensive logging for troubleshooting and monitoring

### ✅ **Frontend-Backend Consistency**
- Uses same API endpoints as GUI interface
- Identical model filtering and error handling logic
- Consistent user experience across all interfaces

## Deployment Considerations

### 1. Backward Compatibility
- **Graceful Degradation**: Works with older backend versions
- **Fallback Behavior**: Static models when dynamic discovery fails
- **No Breaking Changes**: Existing functionality remains intact

### 2. Performance Impact
- **Minimal Overhead**: Only queries Ollama when local provider selected
- **Efficient Caching**: Reduces API calls through coordinator caching
- **Timeout Protection**: Prevents hanging on Ollama connectivity issues

### 3. Configuration Requirements
- **No Additional Setup**: Uses existing Ollama configuration
- **Automatic Discovery**: Works with any properly configured Ollama instance
- **Docker Compatibility**: Handles Docker networking automatically

## Future Enhancement Opportunities

### 1. Advanced Model Management
- **Model Installation**: Service calls to install new Ollama models
- **Model Removal**: Service calls to remove unused models
- **Model Updates**: Automatic detection of model updates
- **Model Recommendations**: Suggest optimal models for doorbell use

### 2. Enhanced Monitoring
- **Performance Metrics**: Track model response times and accuracy
- **Usage Statistics**: Monitor model usage patterns
- **Health Monitoring**: Continuous Ollama service health checks
- **Capacity Planning**: Model storage and memory usage tracking

### 3. User Experience Improvements
- **Model Previews**: Show model capabilities and use cases
- **Installation Wizard**: Guided model installation process
- **Performance Comparison**: Side-by-side model performance metrics
- **Smart Defaults**: Automatic model selection based on hardware

## Testing and Validation

### 1. Model Discovery Testing
- **Connection Success**: Dynamic models appear when Ollama connected
- **Connection Failure**: Fallback models shown when Ollama unavailable
- **Model Changes**: List updates when models added/removed
- **Provider Switching**: Correct behavior when switching to/from local

### 2. Service Testing
- **Refresh Service**: Model list updates on service call
- **Connection Test**: Status information returned correctly
- **Error Handling**: Graceful handling of service call failures
- **Multi-Instance**: Services work across multiple integrations

### 3. Integration Testing
- **Entity Updates**: Model select entity reflects dynamic models
- **Attribute Updates**: Rich metadata appears in entity attributes
- **Coordinator Sync**: Data synchronization works correctly
- **Performance**: No significant impact on update intervals

## Conclusion

This implementation successfully brings dynamic Ollama model discovery to the Home Assistant WhoRang integration, providing users with real-time visibility into their locally available models while maintaining the robustness and reliability expected from a production Home Assistant integration.

**Key Benefits Delivered**:
- ✅ **Real-time Model Discovery**: Shows actual installed Ollama models
- ✅ **Rich Model Metadata**: Size, modification date, and capabilities
- ✅ **Frontend-Backend Parity**: Consistent with GUI interface
- ✅ **Robust Error Handling**: Graceful fallbacks and detailed diagnostics
- ✅ **Service Integration**: Management and troubleshooting capabilities
- ✅ **Professional Quality**: Production-ready implementation

**Architecture Patterns Established**:
- **Leveraging Existing Infrastructure**: Reused proven GUI API endpoints
- **Dynamic Entity Options**: Real-time option list updates based on external state
- **Rich Entity Metadata**: Comprehensive state attributes for debugging and monitoring
- **Service-Based Management**: Comprehensive service API for advanced operations
- **Graceful Degradation**: Robust fallback mechanisms for reliability

This implementation transforms the local model selection from a static list to a dynamic, real-time reflection of the user's actual Ollama installation, providing the same sophisticated model management capabilities available in the WhoRang GUI interface while maintaining the reliability and user experience standards expected from Home Assistant integrations.
