
const { getDatabase } = require('../config/database');

class FaceConfigController {
  // Get face recognition config
  static getConfig(req, res) {
    const db = getDatabase();
    
    try {
      const stmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
      const config = stmt.get();
      
      console.log('Getting face config from database:', config);
      
      // Don't return API key in response
      if (config) {
        const { api_key, ...safeConfig } = config;
        res.json({ ...safeConfig, has_api_key: !!api_key });
      } else {
        res.json({
          enabled: false,
          ai_provider: 'local',
          confidence_threshold: 0.6,
          training_images_per_person: 3,
          auto_delete_after_days: 0,
          background_processing: true,
          ollama_url: 'http://localhost:11434',
          ollama_model: 'llava',
          has_api_key: false
        });
      }
    } catch (err) {
      console.error('Error getting face config:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // Update face recognition config
  static updateConfig(req, res) {
    const db = getDatabase();
    const { 
      enabled, 
      ai_provider, 
      api_key, 
      confidence_threshold, 
      training_images_per_person, 
      auto_delete_after_days, 
      background_processing,
      ollama_url,
      ollama_model,
      openai_model,
      claude_model,
      cost_tracking_enabled,
      monthly_budget_limit
    } = req.body;
    
      console.log('=== FACE CONFIG UPDATE DEBUG ===');
      console.log('Received request body:', {
        enabled,
        ai_provider,
        has_api_key: !!api_key,
        confidence_threshold,
        training_images_per_person,
        auto_delete_after_days,
        background_processing,
        ollama_url,
        ollama_model
      });
      console.log('Raw request body:', req.body);
    
    try {
      // Validate input data
      if (confidence_threshold !== undefined && (confidence_threshold < 0.1 || confidence_threshold > 1.0)) {
        return res.status(400).json({ error: 'Confidence threshold must be between 0.1 and 1.0' });
      }
      
      if (training_images_per_person !== undefined && training_images_per_person < 1) {
        return res.status(400).json({ error: 'Training images per person must be at least 1' });
      }
      
      if (auto_delete_after_days !== undefined && auto_delete_after_days < 0) {
        return res.status(400).json({ error: 'Auto delete days cannot be negative' });
      }

      // Validate and normalize Ollama URL if provided
      let normalizedOllamaUrl = ollama_url;
      if (ollama_url && ai_provider === 'local') {
        try {
          // Add http:// if no protocol is specified
          if (!ollama_url.startsWith('http://') && !ollama_url.startsWith('https://')) {
            normalizedOllamaUrl = `http://${ollama_url}`;
          }
          
          // Validate URL format
          new URL(normalizedOllamaUrl);
          console.log('Normalized Ollama URL from', ollama_url, 'to', normalizedOllamaUrl);
        } catch (error) {
          console.error('Invalid Ollama URL format:', ollama_url, error.message);
          return res.status(400).json({ error: 'Invalid Ollama URL format' });
        }
      }

      // Convert boolean values to integers for SQLite
      const enabledInt = enabled ? 1 : 0;
      const backgroundProcessingInt = background_processing ? 1 : 0;
      
      // Check current database schema
      const schemaStmt = db.prepare("PRAGMA table_info(face_recognition_config)");
      const columns = schemaStmt.all();
      console.log('Current database schema:', columns.map(col => col.name));
      
      const existingStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
      const existing = existingStmt.get();
      console.log('Existing config in database:', existing);
      
      if (existing) {
        console.log('Updating existing config with ID:', existing.id);
        
        // Build update query dynamically based on available columns
        const availableColumns = columns.map(col => col.name);
        let updateParts = [];
        let params = [];
        
        // Always update these core fields
        updateParts.push('enabled = ?', 'ai_provider = ?', 'ollama_url = ?', 'ollama_model = ?', 'updated_at = datetime(\'now\')');
        params.push(enabledInt, ai_provider, normalizedOllamaUrl || 'http://localhost:11434', ollama_model || 'llava');
        
        // Conditionally update other fields if they exist
        if (availableColumns.includes('confidence_threshold') && confidence_threshold !== undefined) {
          updateParts.push('confidence_threshold = ?');
          params.push(confidence_threshold);
        }
        
        if (availableColumns.includes('training_images_per_person') && training_images_per_person !== undefined) {
          updateParts.push('training_images_per_person = ?');
          params.push(training_images_per_person);
        }
        
        if (availableColumns.includes('auto_delete_after_days') && auto_delete_after_days !== undefined) {
          updateParts.push('auto_delete_after_days = ?');
          params.push(auto_delete_after_days);
        }
        
        if (availableColumns.includes('background_processing') && background_processing !== undefined) {
          updateParts.push('background_processing = ?');
          params.push(backgroundProcessingInt);
        }
        
        // Only update API key if provided
        if (api_key && api_key.trim() && availableColumns.includes('api_key')) {
          updateParts.push('api_key = ?');
          params.push(api_key.trim());
        }
        
        // Update OpenAI model if provided
        if (availableColumns.includes('openai_model') && openai_model !== undefined) {
          updateParts.push('openai_model = ?');
          params.push(openai_model || 'gpt-4o');
        }
        
        // Update Claude model if provided
        if (availableColumns.includes('claude_model') && claude_model !== undefined) {
          updateParts.push('claude_model = ?');
          params.push(claude_model || 'claude-3-sonnet-20240229');
        }
        
        // Update cost tracking settings
        if (availableColumns.includes('cost_tracking_enabled') && cost_tracking_enabled !== undefined) {
          updateParts.push('cost_tracking_enabled = ?');
          params.push(cost_tracking_enabled ? 1 : 0);
        }
        
        if (availableColumns.includes('monthly_budget_limit') && monthly_budget_limit !== undefined) {
          updateParts.push('monthly_budget_limit = ?');
          params.push(monthly_budget_limit || 0);
        }
        
        const updateQuery = `UPDATE face_recognition_config SET ${updateParts.join(', ')} WHERE id = ?`;
        params.push(existing.id);
        
        console.log('Update query:', updateQuery);
        console.log('Update params:', params);
        
        const updateStmt = db.prepare(updateQuery);
        const result = updateStmt.run(...params);
        console.log('Update result:', result);
        
        // Verify the update worked
        const verifyStmt = db.prepare('SELECT * FROM face_recognition_config WHERE id = ?');
        const updatedConfig = verifyStmt.get(existing.id);
        console.log('Verified updated config:', updatedConfig);
        
      } else {
        console.log('Creating new face config');
        const insertStmt = db.prepare(`
          INSERT INTO face_recognition_config 
          (enabled, ai_provider, api_key, confidence_threshold, training_images_per_person, 
           auto_delete_after_days, background_processing, ollama_url, ollama_model)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = insertStmt.run(
          enabledInt,
          ai_provider,
          api_key?.trim() || null,
          confidence_threshold || 0.6,
          training_images_per_person || 3,
          auto_delete_after_days || 0,
          backgroundProcessingInt,
          normalizedOllamaUrl || 'http://localhost:11434',
          ollama_model || 'llava'
        );
        console.log('Insert result:', result);
        
        // Verify the insert worked
        const verifyStmt = db.prepare('SELECT * FROM face_recognition_config WHERE id = ?');
        const insertedConfig = verifyStmt.get(result.lastInsertRowid);
        console.log('Verified inserted config:', insertedConfig);
      }
      
      // Final verification - get the current config
      const finalStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
      const finalConfig = finalStmt.get();
      console.log('=== FINAL CONFIG IN DATABASE ===', finalConfig);
      
      res.json({ 
        message: 'Face recognition config updated successfully',
        debug: {
          received_url: ollama_url,
          normalized_url: normalizedOllamaUrl,
          saved_config: finalConfig
        }
      });
    } catch (err) {
      console.error('Error updating face config:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        errno: err.errno,
        stack: err.stack
      });
      res.status(500).json({ 
        error: 'Failed to update face recognition config',
        details: err.message 
      });
    }
  }

  // Debug endpoint to check database state
  static getDebugInfo(req, res) {
    const db = getDatabase();
    
    try {
      // Get schema info
      const schemaStmt = db.prepare("PRAGMA table_info(face_recognition_config)");
      const columns = schemaStmt.all();
      
      // Get current config
      const configStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
      const config = configStmt.get();
      
      // Get all configs (in case there are multiple rows)
      const allConfigsStmt = db.prepare('SELECT * FROM face_recognition_config');
      const allConfigs = allConfigsStmt.all();
      
      res.json({
        schema: columns,
        current_config: config,
        all_configs: allConfigs,
        table_exists: true
      });
    } catch (err) {
      console.error('Error getting debug info:', err);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = FaceConfigController;
