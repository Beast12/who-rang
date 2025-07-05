
const { getDatabase } = require('../config/database');
const http = require('http');
const https = require('https');
const { URL } = require('url');

class OllamaController {
  // Helper method to make HTTP requests
  static makeHttpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: options.timeout || 10000
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              status: res.statusCode,
              data: jsonData
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              data: data
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  // Helper method to get Ollama URL with Docker networking support
  static getOllamaUrl() {
    const db = getDatabase();
    const configStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
    const config = configStmt.get();
    
    let ollamaUrl = config?.ollama_url || 'http://localhost:11434';
    
    console.log('=== OLLAMA URL RESOLUTION ===');
    console.log('Raw config from database:', config);
    console.log('Original Ollama URL:', ollamaUrl);
    
    // Docker networking fixes - only convert localhost/127.0.0.1, leave external IPs as-is
    if (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV) {
      // Replace localhost and 127.0.0.1 with host.docker.internal for Docker
      if (ollamaUrl.includes('localhost') || ollamaUrl.includes('127.0.0.1')) {
        ollamaUrl = ollamaUrl.replace(/localhost|127\.0\.0\.1/, 'host.docker.internal');
        console.log('Docker environment detected, converted localhost to:', ollamaUrl);
      }
      // For external network IPs, keep them as-is (they should work from Docker containers)
      else if (ollamaUrl.match(/192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.1[6-9]\.\d+\.\d+/)) {
        console.log('External network IP detected, using as-is:', ollamaUrl);
      }
    }
    
    console.log('Final Ollama URL:', ollamaUrl);
    return ollamaUrl;
  }

  // Get available models from Ollama instance
  static async getAvailableModels(req, res) {
    try {
      const ollamaUrl = OllamaController.getOllamaUrl();
      
      console.log('=== FETCHING OLLAMA MODELS ===');
      console.log('Using Ollama URL:', ollamaUrl);
      
      // Fetch models from Ollama using native HTTP client
      const response = await OllamaController.makeHttpRequest(`${ollamaUrl}/api/tags`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Ollama response status:', response.status);
      console.log('Ollama response data:', response.data);

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Unable to fetch models from Ollama at ${ollamaUrl}`);
      }

      // Filter to only vision-capable models
      const visionModels = response.data.models?.filter(model => {
        const name = model.name.toLowerCase();
        return name.includes('llava') || name.includes('bakllava') || name.includes('vision');
      }) || [];

      // Transform models for frontend
      const transformedModels = visionModels.map(model => ({
        value: model.name,
        label: model.name,
        size: model.size,
        modified_at: model.modified_at
      }));

      // Add default fallback if no models found
      if (transformedModels.length === 0) {
        transformedModels.push({
          value: 'llava',
          label: 'LLaVA (Not installed)',
          size: 0,
          modified_at: null
        });
      }

      console.log(`Found ${transformedModels.length} vision models at ${ollamaUrl}`);

      res.json({
        models: transformedModels,
        ollama_url: ollamaUrl,
        total: transformedModels.length
      });

    } catch (error) {
      console.error('=== OLLAMA MODELS ERROR ===');
      console.error('Error details:', error);
      
      const ollamaUrl = OllamaController.getOllamaUrl();
      
      let errorMessage = error.message;
      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Connection refused - Ollama server not running at ${ollamaUrl}`;
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        errorMessage = `Connection timeout - Ollama server at ${ollamaUrl} not responding`;
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = `Host not found - Cannot resolve ${ollamaUrl}`;
      }
      
      // Return fallback models on error
      const fallbackModels = [
        { value: 'llava', label: 'LLaVA (Default)' },
        { value: 'llava:7b', label: 'LLaVA 7B' },
        { value: 'llava:13b', label: 'LLaVA 13B' },
        { value: 'bakllava', label: 'BakLLaVA' },
      ];

      res.json({
        models: fallbackModels,
        ollama_url: ollamaUrl,
        total: fallbackModels.length,
        error: errorMessage,
        fallback: true,
        debug: {
          original_error: error.message,
          error_code: error.code,
          attempted_url: ollamaUrl
        }
      });
    }
  }

  // Test Ollama connection
  static async testConnection(req, res) {
    try {
      const ollamaUrl = OllamaController.getOllamaUrl();
      
      console.log('=== TESTING OLLAMA CONNECTION ===');
      console.log('Testing connection to:', ollamaUrl);
      
      const response = await OllamaController.makeHttpRequest(`${ollamaUrl}/api/version`, {
        timeout: 5000
      });

      console.log('Connection test response status:', response.status);
      console.log('Connection test response data:', response.data);

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Unable to connect to Ollama at ${ollamaUrl}`);
      }

      const versionData = response.data;
      
      console.log('Ollama connection successful, version:', versionData.version);
      
      res.json({
        success: true,
        message: `Successfully connected to Ollama at ${ollamaUrl}`,
        ollama_url: ollamaUrl,
        version: versionData.version || 'Unknown',
        debug: {
          response_status: response.status,
          response_data: versionData
        }
      });

    } catch (error) {
      console.error('=== OLLAMA CONNECTION TEST FAILED ===');
      console.error('Error details:', error);
      
      const ollamaUrl = OllamaController.getOllamaUrl();
      
      let errorMessage = error.message;
      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Connection refused - Ollama server not running at ${ollamaUrl}`;
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        errorMessage = `Connection timeout - Ollama server at ${ollamaUrl} not responding`;
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = `Host not found - Cannot resolve ${ollamaUrl}. In Docker, try using 'host.docker.internal' instead of 'localhost'`;
      }
      
      res.status(500).json({
        success: false,
        message: `Failed to connect to Ollama: ${errorMessage}`,
        ollama_url: ollamaUrl,
        error_details: error.message,
        debug: {
          error_code: error.code,
          attempted_url: ollamaUrl,
          docker_env: !!process.env.DOCKER_ENV || process.env.NODE_ENV === 'production',
          suggestions: [
            'Ensure Ollama is running on the specified host',
            'Check if the URL is accessible from the Docker container',
            'For Docker environments, consider using host.docker.internal instead of localhost',
            'Verify firewall settings allow connections to the Ollama port'
          ]
        }
      });
    }
  }
}

module.exports = OllamaController;
