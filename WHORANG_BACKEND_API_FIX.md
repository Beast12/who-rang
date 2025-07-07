# WhoRang Backend API Fix - AI Provider Endpoints

## Issue Identified
The Home Assistant integration was failing with the error:
```
Failed to set AI provider openai: Endpoint not found: /api/openai/provider
```

## Root Cause
The WhoRang backend was missing the API endpoints that the Home Assistant integration expected for AI provider management. The integration was trying to call `/api/openai/provider` and `/api/openai/providers` but these endpoints didn't exist in the backend.

## Solution Implemented

### 1. Added Missing Routes (`backend/routes/openai.js`)

**Added two new routes:**
```javascript
// Get available AI providers
router.get('/providers', openaiController.getAvailableProviders);

// Set AI provider
router.post('/provider', openaiController.setAIProvider);
```

### 2. Added Controller Methods (`backend/controllers/openaiController.js`)

**Added `getAvailableProviders` method:**
```javascript
static async getAvailableProviders(req, res) {
  try {
    const providers = {
      local: { requires_key: false, name: 'Local Ollama' },
      openai: { requires_key: true, name: 'OpenAI Vision' },
      claude: { requires_key: true, name: 'Claude Vision' },
      gemini: { requires_key: true, name: 'Google Gemini' },
      'google-cloud-vision': { requires_key: true, name: 'Google Cloud Vision' }
    };

    res.json({
      data: providers,
      providers: Object.keys(providers)
    });
  } catch (error) {
    // Error handling
  }
}
```

**Added `setAIProvider` method:**
```javascript
static async setAIProvider(req, res) {
  try {
    const { provider, api_key } = req.body;
    
    // Validation
    const validProviders = ['local', 'openai', 'claude', 'gemini', 'google-cloud-vision'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`
      });
    }

    const db = getDatabase();
    
    // Get or create face_recognition_config
    const configStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
    let config = configStmt.get();

    if (!config) {
      // Create initial config
      const insertStmt = db.prepare(`
        INSERT INTO face_recognition_config (
          enabled, ai_provider, confidence_threshold, cost_tracking_enabled,
          monthly_budget_limit, api_key, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const now = new Date().toISOString();
      insertStmt.run(1, provider, 0.7, 1, 50.0, api_key || null, now, now);
    } else {
      // Update existing config
      const updateStmt = db.prepare(`
        UPDATE face_recognition_config 
        SET ai_provider = ?, api_key = ?, updated_at = ?
        WHERE id = ?
      `);
      
      updateStmt.run(
        provider,
        api_key || config.api_key, // Keep existing API key if not provided
        new Date().toISOString(),
        config.id
      );
    }

    res.json({
      success: true,
      message: `AI provider set to ${provider}`,
      provider: provider,
      has_api_key: !!api_key
    });
  } catch (error) {
    // Error handling
  }
}
```

## API Endpoints Now Available

### GET `/api/openai/providers`
**Purpose:** Get list of available AI providers and their requirements
**Response:**
```json
{
  "data": {
    "local": { "requires_key": false, "name": "Local Ollama" },
    "openai": { "requires_key": true, "name": "OpenAI Vision" },
    "claude": { "requires_key": true, "name": "Claude Vision" },
    "gemini": { "requires_key": true, "name": "Google Gemini" },
    "google-cloud-vision": { "requires_key": true, "name": "Google Cloud Vision" }
  },
  "providers": ["local", "openai", "claude", "gemini", "google-cloud-vision"]
}
```

### POST `/api/openai/provider`
**Purpose:** Set the active AI provider with optional API key
**Request Body:**
```json
{
  "provider": "openai",
  "api_key": "sk-..." // Optional, only for external providers
}
```
**Response:**
```json
{
  "success": true,
  "message": "AI provider set to openai",
  "provider": "openai",
  "has_api_key": true
}
```

## Database Integration

The endpoints integrate with the existing `face_recognition_config` table:
- **ai_provider**: Stores the currently selected provider
- **api_key**: Stores the API key for external providers
- **Auto-creation**: Creates initial config if none exists
- **Update logic**: Updates existing config while preserving other settings

## Error Handling

**Comprehensive error handling includes:**
- Provider validation (must be in allowed list)
- Database error handling
- Detailed logging for debugging
- Proper HTTP status codes
- User-friendly error messages

## Integration with Home Assistant

This fix resolves the integration error by providing the expected API endpoints:
1. **Provider Discovery**: HA integration can fetch available providers
2. **Provider Switching**: HA integration can set active provider with API key
3. **API Key Management**: Backend stores and manages API keys securely
4. **Configuration Persistence**: Settings are stored in database

## Testing

The endpoints can be tested with:

```bash
# Get available providers
curl -X GET https://api-doorbell.tuxito.be/api/openai/providers

# Set AI provider with API key
curl -X POST https://api-doorbell.tuxito.be/api/openai/provider \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai", "api_key": "sk-..."}'

# Set local provider (no API key needed)
curl -X POST https://api-doorbell.tuxito.be/api/openai/provider \
  -H "Content-Type: application/json" \
  -d '{"provider": "local"}'
```

## Resolution

This fix resolves the "Endpoint not found: /api/openai/provider" error by:
1. ✅ Adding the missing `/api/openai/provider` POST endpoint
2. ✅ Adding the missing `/api/openai/providers` GET endpoint  
3. ✅ Implementing proper database integration
4. ✅ Supporting API key management for external providers
5. ✅ Maintaining backward compatibility with existing configurations

The Home Assistant integration should now be able to successfully switch AI providers and manage API keys through the WhoRang backend.
