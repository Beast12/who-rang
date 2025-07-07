const { getDatabase } = require('../config/database');
const { OpenAIVisionProvider } = require('../services/aiProviders');

class OpenAIController {
  // Get available models from OpenAI API
  static async getAvailableModels(req, res) {
    try {
      const db = getDatabase();
      const configStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
      const config = configStmt.get();
      
      if (!config || !config.api_key) {
        return res.status(400).json({
          error: 'OpenAI API key not configured',
          models: [],
          fallback: true
        });
      }

      console.log('=== FETCHING OPENAI MODELS ===');
      console.log('Using API key:', config.api_key ? '***' + config.api_key.slice(-4) : 'Not set');
      
      // Fetch models from OpenAI API
      const models = await OpenAIVisionProvider.getAvailableModels(config.api_key);

      console.log(`Found ${models.length} vision models from OpenAI`);

      res.json({
        models: models,
        total: models.length,
        current_model: config.openai_model || 'gpt-4o'
      });

    } catch (error) {
      console.error('=== OPENAI MODELS ERROR ===');
      console.error('Error details:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('401')) {
        errorMessage = 'Invalid OpenAI API key';
      } else if (error.message.includes('403')) {
        errorMessage = 'OpenAI API access forbidden - check your API key permissions';
      } else if (error.message.includes('429')) {
        errorMessage = 'OpenAI API rate limit exceeded';
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'Cannot connect to OpenAI API - check internet connection';
      }
      
      // Return fallback models on error
      const fallbackModels = [
        { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Cost-effective)' },
        { value: 'gpt-4-vision-preview', label: 'GPT-4 Vision Preview' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
      ];

      res.json({
        models: fallbackModels,
        total: fallbackModels.length,
        error: errorMessage,
        fallback: true,
        debug: {
          original_error: error.message,
          has_api_key: !!config?.api_key
        }
      });
    }
  }

  // Test OpenAI API connection
  static async testConnection(req, res) {
    try {
      const db = getDatabase();
      const configStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
      const config = configStmt.get();
      
      if (!config || !config.api_key) {
        return res.status(400).json({
          success: false,
          message: 'OpenAI API key not configured'
        });
      }

      console.log('=== TESTING OPENAI CONNECTION ===');
      console.log('Testing API key:', config.api_key ? '***' + config.api_key.slice(-4) : 'Not set');
      console.log('Testing model:', config.openai_model || 'gpt-4o');
      
      const result = await OpenAIVisionProvider.testConnection(
        config.api_key, 
        config.openai_model || 'gpt-4o'
      );

      console.log('OpenAI connection test result:', result);
      
      res.json(result);

    } catch (error) {
      console.error('=== OPENAI CONNECTION TEST FAILED ===');
      console.error('Error details:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('401')) {
        errorMessage = 'Invalid OpenAI API key';
      } else if (error.message.includes('403')) {
        errorMessage = 'OpenAI API access forbidden - check your API key permissions';
      } else if (error.message.includes('429')) {
        errorMessage = 'OpenAI API rate limit exceeded';
      }
      
      res.status(500).json({
        success: false,
        message: `Failed to connect to OpenAI: ${errorMessage}`,
        debug: {
          original_error: error.message,
          suggestions: [
            'Verify your OpenAI API key is valid and active',
            'Check if your API key has vision model access',
            'Ensure you have sufficient API credits',
            'Verify your internet connection'
          ]
        }
      });
    }
  }

  // Get AI usage statistics
  static async getUsageStats(req, res) {
    try {
      const db = getDatabase();
      const { period = '30d' } = req.query;
      
      let dateFilter = '';
      const now = new Date();
      
      switch (period) {
        case '24h':
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          dateFilter = `AND created_at >= '${yesterday.toISOString()}'`;
          break;
        case '7d':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = `AND created_at >= '${weekAgo.toISOString()}'`;
          break;
        case '30d':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = `AND created_at >= '${monthAgo.toISOString()}'`;
          break;
      }

      // Get overall usage statistics
      const overallStmt = db.prepare(`
        SELECT 
          provider,
          COUNT(*) as total_requests,
          SUM(total_tokens) as total_tokens,
          SUM(cost_usd) as total_cost,
          AVG(processing_time_ms) as avg_processing_time,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_requests
        FROM ai_usage_tracking 
        WHERE 1=1 ${dateFilter}
        GROUP BY provider
        ORDER BY total_cost DESC
      `);
      
      const overallStats = overallStmt.all();

      // Get daily breakdown for charts
      const dailyStmt = db.prepare(`
        SELECT 
          DATE(created_at) as date,
          provider,
          COUNT(*) as requests,
          SUM(total_tokens) as tokens,
          SUM(cost_usd) as cost
        FROM ai_usage_tracking 
        WHERE 1=1 ${dateFilter}
        GROUP BY DATE(created_at), provider
        ORDER BY date DESC
      `);
      
      const dailyStats = dailyStmt.all();

      // Get model breakdown
      const modelStmt = db.prepare(`
        SELECT 
          model,
          provider,
          COUNT(*) as requests,
          SUM(total_tokens) as tokens,
          SUM(cost_usd) as cost,
          AVG(processing_time_ms) as avg_time
        FROM ai_usage_tracking 
        WHERE 1=1 ${dateFilter}
        GROUP BY model, provider
        ORDER BY cost DESC
      `);
      
      const modelStats = modelStmt.all();

      // Get current month budget usage
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const budgetStmt = db.prepare(`
        SELECT 
          SUM(cost_usd) as monthly_spent
        FROM ai_usage_tracking 
        WHERE created_at >= ? AND provider = 'openai'
      `);
      
      const budgetUsage = budgetStmt.get(currentMonth.toISOString());

      // Get budget limit from config
      const configStmt = db.prepare('SELECT monthly_budget_limit FROM face_recognition_config LIMIT 1');
      const config = configStmt.get();

      res.json({
        period,
        overall_stats: overallStats,
        daily_stats: dailyStats,
        model_stats: modelStats,
        budget: {
          monthly_limit: config?.monthly_budget_limit || 0,
          monthly_spent: budgetUsage?.monthly_spent || 0,
          remaining: Math.max(0, (config?.monthly_budget_limit || 0) - (budgetUsage?.monthly_spent || 0))
        }
      });

    } catch (error) {
      console.error('Error fetching usage stats:', error);
      res.status(500).json({
        error: 'Failed to fetch usage statistics',
        details: error.message
      });
    }
  }

  // Get recent AI usage logs
  static async getUsageLogs(req, res) {
    try {
      const db = getDatabase();
      const { limit = 50, offset = 0, provider } = req.query;
      
      let providerFilter = '';
      if (provider) {
        providerFilter = `AND provider = '${provider}'`;
      }

      const stmt = db.prepare(`
        SELECT 
          aut.*,
          de.visitor_id,
          de.timestamp as event_timestamp
        FROM ai_usage_tracking aut
        LEFT JOIN doorbell_events de ON aut.visitor_event_id = de.id
        WHERE 1=1 ${providerFilter}
        ORDER BY aut.created_at DESC
        LIMIT ? OFFSET ?
      `);
      
      const logs = stmt.all(parseInt(limit), parseInt(offset));

      // Get total count for pagination
      const countStmt = db.prepare(`
        SELECT COUNT(*) as total 
        FROM ai_usage_tracking 
        WHERE 1=1 ${providerFilter}
      `);
      const { total } = countStmt.get();

      res.json({
        logs,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + parseInt(limit)) < total
        }
      });

    } catch (error) {
      console.error('Error fetching usage logs:', error);
      res.status(500).json({
        error: 'Failed to fetch usage logs',
        details: error.message
      });
    }
  }

  // Get available AI providers
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
      console.error('Error fetching available providers:', error);
      res.status(500).json({
        error: 'Failed to fetch available providers',
        details: error.message
      });
    }
  }

  // Set AI provider
  static async setAIProvider(req, res) {
    try {
      const { provider, api_key } = req.body;
      
      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider is required'
        });
      }

      const validProviders = ['local', 'openai', 'claude', 'gemini', 'google-cloud-vision'];
      if (!validProviders.includes(provider)) {
        return res.status(400).json({
          success: false,
          error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`
        });
      }

      console.log('=== SETTING AI PROVIDER ===');
      console.log('Provider:', provider);
      console.log('Has API key:', !!api_key);

      const db = getDatabase();
      
      // Get current config
      const configStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
      let config = configStmt.get();

      if (!config) {
        // Create initial config if it doesn't exist
        const insertStmt = db.prepare(`
          INSERT INTO face_recognition_config (
            enabled, ai_provider, confidence_threshold, cost_tracking_enabled,
            monthly_budget_limit, api_key, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const now = new Date().toISOString();
        insertStmt.run(
          1, // enabled
          provider,
          0.7, // confidence_threshold
          1, // cost_tracking_enabled
          50.0, // monthly_budget_limit
          api_key || null,
          now,
          now
        );
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

      console.log(`Successfully set AI provider to: ${provider}`);

      res.json({
        success: true,
        message: `AI provider set to ${provider}`,
        provider: provider,
        has_api_key: !!api_key
      });

    } catch (error) {
      console.error('=== SET AI PROVIDER ERROR ===');
      console.error('Error details:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to set AI provider',
        details: error.message
      });
    }
  }

  // Get available models for specific provider
  static async getProviderModels(req, res) {
    try {
      const { provider } = req.params;
      
      console.log('=== GETTING PROVIDER MODELS ===');
      console.log('Provider:', provider);

      const defaultModels = OpenAIController._getDefaultModels();
      
      if (!defaultModels[provider]) {
        return res.status(400).json({
          error: `Unknown provider: ${provider}`,
          available_providers: Object.keys(defaultModels)
        });
      }

      // For local provider, try to get dynamic models from Ollama
      if (provider === 'local') {
        // TODO: Implement Ollama model fetching
        // For now, return default local models
        res.json({
          data: defaultModels[provider],
          provider: provider,
          total: defaultModels[provider].length
        });
        return;
      }

      // For external providers, return default models
      // TODO: Implement dynamic model fetching for each provider
      res.json({
        data: defaultModels[provider],
        provider: provider,
        total: defaultModels[provider].length
      });

    } catch (error) {
      console.error('=== GET PROVIDER MODELS ERROR ===');
      console.error('Error details:', error);
      
      res.status(500).json({
        error: 'Failed to get provider models',
        details: error.message
      });
    }
  }

  // Get current AI model
  static async getCurrentModel(req, res) {
    try {
      const db = getDatabase();
      const configStmt = db.prepare('SELECT ai_provider, current_ai_model, ollama_model, openai_model FROM face_recognition_config LIMIT 1');
      const config = configStmt.get();

      if (!config) {
        return res.json({
          data: {
            provider: 'local',
            model: 'llava'
          }
        });
      }

      let currentModel = config.current_ai_model;
      
      // Fallback to provider-specific model fields if current_ai_model is not set
      if (!currentModel) {
        switch (config.ai_provider) {
          case 'local':
            currentModel = config.ollama_model || 'llava';
            break;
          case 'openai':
            currentModel = config.openai_model || 'gpt-4o';
            break;
          default:
            currentModel = 'default';
        }
      }

      res.json({
        data: {
          provider: config.ai_provider || 'local',
          model: currentModel
        }
      });

    } catch (error) {
      console.error('=== GET CURRENT MODEL ERROR ===');
      console.error('Error details:', error);
      
      res.status(500).json({
        error: 'Failed to get current model',
        details: error.message
      });
    }
  }

  // Set AI model
  static async setAIModel(req, res) {
    try {
      const { model } = req.body;
      
      if (!model) {
        return res.status(400).json({
          success: false,
          error: 'Model is required'
        });
      }

      console.log('=== SETTING AI MODEL ===');
      console.log('Model:', model);

      const db = getDatabase();
      
      // Get current config
      const configStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
      let config = configStmt.get();

      if (!config) {
        return res.status(400).json({
          success: false,
          error: 'AI configuration not found. Please set up AI provider first.'
        });
      }

      // Update the current model and provider-specific model field
      const updateStmt = db.prepare(`
        UPDATE face_recognition_config 
        SET current_ai_model = ?, 
            ${config.ai_provider === 'local' ? 'ollama_model' : 
              config.ai_provider === 'openai' ? 'openai_model' : 
              'current_ai_model'} = ?,
            updated_at = ?
        WHERE id = ?
      `);
      
      updateStmt.run(
        model,
        model,
        new Date().toISOString(),
        config.id
      );

      console.log(`Successfully set AI model to: ${model} for provider: ${config.ai_provider}`);

      res.json({
        success: true,
        message: `AI model set to ${model}`,
        model: model,
        provider: config.ai_provider
      });

    } catch (error) {
      console.error('=== SET AI MODEL ERROR ===');
      console.error('Error details:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to set AI model',
        details: error.message
      });
    }
  }

  // Get default model mappings
  static _getDefaultModels() {
    return {
      local: [
        'llava',
        'llava:7b',
        'llava:13b',
        'llava:34b',
        'bakllava',
        'cogvlm',
        'llama-vision'
      ],
      openai: [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4-vision-preview',
        'gpt-3.5-turbo'
      ],
      claude: [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ],
      gemini: [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro-vision',
        'gemini-1.0-pro'
      ],
      'google-cloud-vision': [
        'vision-api-v1',
        'vision-api-v1p1beta1',
        'vision-api-v1p2beta1'
      ]
    };
  }
}

module.exports = OpenAIController;
