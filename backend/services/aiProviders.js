
class BaseAIProvider {
  constructor(config) {
    this.config = config;
  }

  async detectFaces(imageUrl) {
    throw new Error('detectFaces method must be implemented');
  }

  async generateFaceEncoding(imageUrl, faceData) {
    throw new Error('generateFaceEncoding method must be implemented');
  }
}

class OpenAIVisionProvider extends BaseAIProvider {
  constructor(config) {
    super(config);
    this.modelPricing = {
      'gpt-4o': { input: 0.005, output: 0.015 }, // per 1K tokens
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4-vision-preview': { input: 0.01, output: 0.03 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 }
    };
  }

  async detectFaces(imageUrl, visitorEventId = null) {
    if (!this.config.api_key) {
      throw new Error('OpenAI API key not configured');
    }

    const startTime = Date.now();
    const model = this.config.openai_model || 'gpt-4o';
    
    try {
      // Handle image URL - convert local paths to accessible URLs
      const processedImageUrl = await this.processImageUrl(imageUrl);
      
      const prompt = `Analyze this doorbell camera image comprehensively. Provide:

1. FACE DETECTION: Detect all human faces with exact bounding box coordinates as percentages (x, y, width, height), confidence levels (0-100), detailed descriptions, and quality assessment.

2. OBJECT DETECTION: Identify all significant objects, people, vehicles, packages, animals, etc. with confidence levels.

3. SCENE ANALYSIS: Overall confidence in the analysis and general scene description.

Return ONLY valid JSON in this exact format:
{
  "faces_detected": number,
  "faces": [
    {
      "id": 1,
      "bounding_box": {"x": 25.5, "y": 30.2, "width": 15.8, "height": 20.1},
      "confidence": 85,
      "description": "Adult male, approximately 30-40 years old, clear frontal view",
      "quality": "clear",
      "distinctive_features": ["beard", "glasses"]
    }
  ],
  "objects_detected": [
    {
      "object": "person",
      "confidence": 90,
      "description": "Adult standing at door"
    },
    {
      "object": "package",
      "confidence": 75,
      "description": "Small delivery box on ground"
    }
  ],
  "scene_analysis": {
    "overall_confidence": 85,
    "description": "Clear daytime image of person at front door",
    "lighting": "good",
    "image_quality": "high"
  }
}

If no faces are detected, set faces_detected to 0 and faces to empty array. Always include objects_detected and scene_analysis.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: [{
              type: 'text',
              text: prompt
            }, {
              type: 'image_url',
              image_url: { 
                url: processedImageUrl,
                detail: 'high' // Use high detail for better face detection
              }
            }]
          }],
          max_tokens: 1000,
          temperature: 0.1 // Low temperature for consistent results
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;
      
      // Track usage and costs
      await this.trackUsage({
        model,
        operation_type: 'face_detection',
        visitor_event_id: visitorEventId,
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
        processing_time_ms: processingTime,
        success: true
      });

      // Parse and validate the response
      const content = data.choices[0].message.content;
      const result = this.parseOpenAIResponse(content);
      
      console.log(`OpenAI ${model} face detection completed in ${processingTime}ms`);
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Track failed usage
      await this.trackUsage({
        model,
        operation_type: 'face_detection',
        visitor_event_id: visitorEventId,
        processing_time_ms: processingTime,
        success: false,
        error_message: error.message
      });

      console.error('OpenAI face detection error:', error);
      throw new Error(`Failed to detect faces with OpenAI: ${error.message}`);
    }
  }

  async processImageUrl(imageUrl) {
    // If it's already a full HTTP URL, return as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // For local images, we need to convert them to base64 data URLs
    // since OpenAI doesn't accept local file paths
    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('./uploads/')) {
      return await this.convertImageToDataUrl(imageUrl);
    }

    // If it's a relative path, assume it's local
    return await this.convertImageToDataUrl(imageUrl);
  }

  async convertImageToDataUrl(imagePath) {
    const fs = require('fs').promises;
    const path = require('path');
    const mime = require('mime-types');

    try {
      let fullPath;
      if (imagePath.startsWith('/uploads/')) {
        fullPath = path.join(__dirname, '..', imagePath);
      } else if (imagePath.startsWith('./uploads/')) {
        fullPath = path.join(__dirname, '..', imagePath.substring(2));
      } else {
        fullPath = imagePath;
      }

      const imageBuffer = await fs.readFile(fullPath);
      const mimeType = mime.lookup(fullPath) || 'image/jpeg';
      const base64Data = imageBuffer.toString('base64');
      
      return `data:${mimeType};base64,${base64Data}`;
    } catch (error) {
      console.error('Error converting image to data URL:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  parseOpenAIResponse(responseText) {
    try {
      console.log('Raw OpenAI response:', responseText);
      
      // Try to extract JSON from the response
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('No JSON found in OpenAI response, creating default');
        return {
          faces_detected: 0,
          faces: [],
          objects_detected: [],
          scene_analysis: {
            overall_confidence: 0,
            description: 'No analysis available',
            lighting: 'unknown',
            image_quality: 'unknown'
          }
        };
      }
      
      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      // Validate and normalize the response structure
      return this.validateAndNormalizeResponse(parsed);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return {
        faces_detected: 0,
        faces: [],
        objects_detected: [],
        scene_analysis: {
          overall_confidence: 0,
          description: 'Error in analysis',
          lighting: 'unknown',
          image_quality: 'unknown'
        }
      };
    }
  }

  validateAndNormalizeResponse(parsed) {
    // Validate the response structure (same as Ollama)
    if (typeof parsed.faces_detected !== 'number') {
      parsed.faces_detected = parsed.faces ? parsed.faces.length : 0;
    }
    
    if (!Array.isArray(parsed.faces)) {
      parsed.faces = [];
    }
    
    // Validate each face object
    parsed.faces = parsed.faces.map((face, index) => {
      return {
        id: face.id || index + 1,
        bounding_box: face.bounding_box || { x: 25, y: 25, width: 50, height: 50 },
        confidence: Math.min(100, Math.max(0, face.confidence || 70)),
        description: face.description || 'Person detected',
        quality: face.quality || 'unknown',
        distinctive_features: Array.isArray(face.distinctive_features) ? face.distinctive_features : []
      };
    });
    
    // Validate objects_detected array
    if (!Array.isArray(parsed.objects_detected)) {
      parsed.objects_detected = [];
    }
    
    // Validate each object
    parsed.objects_detected = parsed.objects_detected.map((obj, index) => {
      return {
        object: obj.object || 'unknown',
        confidence: Math.min(100, Math.max(0, obj.confidence || 50)),
        description: obj.description || 'Object detected'
      };
    });
    
    // Validate scene_analysis
    if (!parsed.scene_analysis || typeof parsed.scene_analysis !== 'object') {
      parsed.scene_analysis = {
        overall_confidence: 70,
        description: 'Scene analysis completed',
        lighting: 'unknown',
        image_quality: 'unknown'
      };
    } else {
      parsed.scene_analysis = {
        overall_confidence: Math.min(100, Math.max(0, parsed.scene_analysis.overall_confidence || 70)),
        description: parsed.scene_analysis.description || 'Scene analysis completed',
        lighting: parsed.scene_analysis.lighting || 'unknown',
        image_quality: parsed.scene_analysis.image_quality || 'unknown'
      };
    }
    
    return parsed;
  }

  async trackUsage(usageData) {
    if (!this.config.cost_tracking_enabled) {
      return;
    }

    try {
      const db = require('../config/database').getDatabase();
      
      // Calculate cost based on token usage and model pricing
      const pricing = this.modelPricing[usageData.model] || this.modelPricing['gpt-4o'];
      const inputCost = (usageData.input_tokens / 1000) * pricing.input;
      const outputCost = (usageData.output_tokens / 1000) * pricing.output;
      const totalCost = inputCost + outputCost;

      const stmt = db.prepare(`
        INSERT INTO ai_usage_tracking (
          provider, model, operation_type, visitor_event_id,
          input_tokens, output_tokens, total_tokens, cost_usd,
          processing_time_ms, success, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        'openai',
        usageData.model,
        usageData.operation_type,
        usageData.visitor_event_id,
        usageData.input_tokens || 0,
        usageData.output_tokens || 0,
        usageData.total_tokens || 0,
        totalCost,
        usageData.processing_time_ms,
        usageData.success ? 1 : 0,
        usageData.error_message || null,
        new Date().toISOString()
      );

      console.log(`Tracked OpenAI usage: ${usageData.total_tokens} tokens, $${totalCost.toFixed(4)}`);
    } catch (error) {
      console.error('Error tracking OpenAI usage:', error);
    }
  }

  async generateFaceEncoding(imageUrl, faceData) {
    // Use the face cropping service to generate proper embeddings
    const faceCroppingService = require('./faceCroppingService');
    
    try {
      const embeddingResult = await faceCroppingService.generateFaceEmbedding(
        imageUrl, 
        faceData.description
      );
      
      return JSON.stringify(embeddingResult.embedding);
    } catch (error) {
      console.error('Error generating face encoding:', error);
      // Fallback to simple hash
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(imageUrl + JSON.stringify(faceData)).digest('hex');
    }
  }

  // Static method to get available OpenAI models
  static async getAvailableModels(apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Unable to fetch models from OpenAI`);
      }

      const data = await response.json();
      
      // Filter for vision-capable models
      const visionModels = data.data.filter(model => {
        const name = model.id.toLowerCase();
        return name.includes('gpt-4') && (
          name.includes('vision') || 
          name.includes('gpt-4o') ||
          name === 'gpt-4-turbo'
        );
      });

      return visionModels.map(model => ({
        value: model.id,
        label: model.id,
        created: model.created,
        owned_by: model.owned_by
      }));
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      // Return fallback models
      return [
        { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Cost-effective)' },
        { value: 'gpt-4-vision-preview', label: 'GPT-4 Vision Preview' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
      ];
    }
  }

  // Test API connection
  static async testConnection(apiKey, model = 'gpt-4o') {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API key validation failed: ${errorData.error?.message || 'Invalid API key'}`);
      }

      return {
        success: true,
        message: 'OpenAI API connection successful',
        models_available: true
      };
    } catch (error) {
      return {
        success: false,
        message: `OpenAI connection failed: ${error.message}`
      };
    }
  }
}

class LocalOllamaProvider extends BaseAIProvider {
  constructor(config) {
    super(config);
    // Ollama is typically free/local, but we track compute costs based on processing time
    this.computeCostPerSecond = 0.001; // $0.001 per second of processing (configurable)
  }

  static makeHttpRequest(url, options = {}) {
    const http = require('http');
    const https = require('https');
    const { URL } = require('url');
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: options.timeout || 30000 // Increased timeout for vision models
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
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              data: jsonData
            });
          } catch (error) {
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
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

  async detectFaces(imageUrl, visitorEventId = null) {
    const ollamaUrl = this.config.ollama_url || 'http://localhost:11434';
    const ollamaModel = this.config.ollama_model || 'llava';
    
    console.log('LocalOllamaProvider using URL:', ollamaUrl);
    console.log('LocalOllamaProvider using model:', ollamaModel);
    
    const startTime = Date.now();
    
    try {
      // Enhanced prompt for comprehensive scene analysis
      const prompt = `Analyze this doorbell camera image comprehensively. Provide:

1. FACE DETECTION: Detect all human faces with exact bounding box coordinates as percentages (x, y, width, height), confidence levels (0-100), detailed descriptions, and quality assessment.

2. OBJECT DETECTION: Identify all significant objects, people, vehicles, packages, animals, etc. with confidence levels.

3. SCENE ANALYSIS: Overall confidence in the analysis and general scene description.

Return ONLY valid JSON in this exact format:
{
  "faces_detected": number,
  "faces": [
    {
      "id": 1,
      "bounding_box": {"x": 25.5, "y": 30.2, "width": 15.8, "height": 20.1},
      "confidence": 85,
      "description": "Adult male, approximately 30-40 years old, clear frontal view",
      "quality": "clear",
      "distinctive_features": ["beard", "glasses"]
    }
  ],
  "objects_detected": [
    {
      "object": "person",
      "confidence": 90,
      "description": "Adult standing at door"
    },
    {
      "object": "package",
      "confidence": 75,
      "description": "Small delivery box on ground"
    }
  ],
  "scene_analysis": {
    "overall_confidence": 85,
    "description": "Clear daytime image of person at front door",
    "lighting": "good",
    "image_quality": "high"
  }
}

If no faces are detected, set faces_detected to 0 and faces to empty array. Always include objects_detected and scene_analysis.`;

      // Convert image to base64 if it's a local path
      const imageBase64 = await this.convertImageToBase64(imageUrl);
      
      const response = await LocalOllamaProvider.makeHttpRequest(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          model: ollamaModel,
          prompt: prompt,
          images: [imageBase64],
          stream: false,
          options: {
            temperature: 0.1, // Low temperature for consistent results
            top_p: 0.9,
            num_predict: 500
          }
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - Check if Ollama is running at ${ollamaUrl}`);
      }

      const processingTime = Date.now() - startTime;
      
      // Parse Ollama response
      const result = this.parseOllamaResponse(response.data);
      
      // Track usage for Ollama (estimate tokens and calculate compute cost)
      await this.trackUsage({
        model: ollamaModel,
        operation_type: 'face_detection',
        visitor_event_id: visitorEventId,
        estimated_tokens: this.estimateTokens(prompt, result),
        processing_time_ms: processingTime,
        success: true
      });
      
      console.log(`Ollama ${ollamaModel} face detection completed in ${processingTime}ms`);
      return result;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Track failed usage
      await this.trackUsage({
        model: ollamaModel,
        operation_type: 'face_detection',
        visitor_event_id: visitorEventId,
        processing_time_ms: processingTime,
        success: false,
        error_message: error.message
      });
      
      console.error('Ollama face detection error:', error);
      throw new Error(`Failed to detect faces with Ollama at ${ollamaUrl}: ${error.message}`);
    }
  }

  async convertImageToBase64(imageUrl) {
    const fs = require('fs').promises;
    const path = require('path');
    const http = require('http');
    const https = require('https');
    
    try {
      let imageBuffer;
      
      // First, try to convert external URLs to local paths
      if (imageUrl.startsWith('http')) {
        // Extract the path from the URL and try to access it locally first
        const urlPath = new URL(imageUrl).pathname;
        if (urlPath.startsWith('/uploads/')) {
          console.log('Converting external URL to local path:', urlPath);
          const localPath = path.join(__dirname, '..', urlPath);
          try {
            imageBuffer = await fs.readFile(localPath);
            console.log('Successfully read image from local path:', localPath);
          } catch (localError) {
            console.log('Local file not found, attempting download:', imageUrl);
            imageBuffer = await this.downloadImage(imageUrl);
          }
        } else {
          // Remote URL - download the image
          console.log('Downloading remote image:', imageUrl);
          imageBuffer = await this.downloadImage(imageUrl);
        }
      } else if (imageUrl.startsWith('/uploads/')) {
        // Local file path
        const imagePath = path.join(__dirname, '..', imageUrl);
        imageBuffer = await fs.readFile(imagePath);
      } else {
        // Direct file path
        imageBuffer = await fs.readFile(imageUrl);
      }
      
      return imageBuffer.toString('base64');
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }

  async downloadImage(url) {
    const http = require('http');
    const https = require('https');
    const { URL } = require('url');
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const request = client.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Doorbell-Face-Detection/1.0'
        }
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
          return;
        }
        
        const chunks = [];
        
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`Downloaded image: ${buffer.length} bytes`);
          resolve(buffer);
        });
        
        response.on('error', (error) => {
          reject(error);
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Image download timeout'));
      });
    });
  }

  parseOllamaResponse(responseData) {
    try {
      // Extract the response text
      const responseText = responseData.response || responseData.message || '';
      console.log('Raw Ollama response:', responseText);
      
      // Try to extract JSON from the response
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // If no JSON found, create a default response
        console.log('No JSON found in response, creating default');
        return {
          faces_detected: 0,
          faces: [],
          objects_detected: [],
          scene_analysis: {
            overall_confidence: 0,
            description: 'No analysis available',
            lighting: 'unknown',
            image_quality: 'unknown'
          }
        };
      }
      
      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      // Validate the response structure
      if (typeof parsed.faces_detected !== 'number') {
        parsed.faces_detected = parsed.faces ? parsed.faces.length : 0;
      }
      
      if (!Array.isArray(parsed.faces)) {
        parsed.faces = [];
      }
      
      // Validate each face object
      parsed.faces = parsed.faces.map((face, index) => {
        return {
          id: face.id || index + 1,
          bounding_box: face.bounding_box || { x: 25, y: 25, width: 50, height: 50 },
          confidence: Math.min(100, Math.max(0, face.confidence || 70)),
          description: face.description || 'Person detected',
          quality: face.quality || 'unknown',
          distinctive_features: Array.isArray(face.distinctive_features) ? face.distinctive_features : []
        };
      });
      
      // Validate objects_detected array
      if (!Array.isArray(parsed.objects_detected)) {
        parsed.objects_detected = [];
      }
      
      // Validate each object
      parsed.objects_detected = parsed.objects_detected.map((obj, index) => {
        return {
          object: obj.object || 'unknown',
          confidence: Math.min(100, Math.max(0, obj.confidence || 50)),
          description: obj.description || 'Object detected'
        };
      });
      
      // Validate scene_analysis
      if (!parsed.scene_analysis || typeof parsed.scene_analysis !== 'object') {
        parsed.scene_analysis = {
          overall_confidence: 70,
          description: 'Scene analysis completed',
          lighting: 'unknown',
          image_quality: 'unknown'
        };
      } else {
        parsed.scene_analysis = {
          overall_confidence: Math.min(100, Math.max(0, parsed.scene_analysis.overall_confidence || 70)),
          description: parsed.scene_analysis.description || 'Scene analysis completed',
          lighting: parsed.scene_analysis.lighting || 'unknown',
          image_quality: parsed.scene_analysis.image_quality || 'unknown'
        };
      }
      
      return parsed;
    } catch (error) {
      console.error('Error parsing Ollama response:', error);
      // Return a safe default
      return {
        faces_detected: 0,
        faces: [],
        objects_detected: [],
        scene_analysis: {
          overall_confidence: 0,
          description: 'Error in analysis',
          lighting: 'unknown',
          image_quality: 'unknown'
        }
      };
    }
  }

  // Estimate tokens for Ollama (since it doesn't provide token counts)
  estimateTokens(prompt, response) {
    // Rough estimation: ~4 characters per token
    const promptTokens = Math.ceil(prompt.length / 4);
    const responseTokens = Math.ceil(JSON.stringify(response).length / 4);
    return {
      input_tokens: promptTokens,
      output_tokens: responseTokens,
      total_tokens: promptTokens + responseTokens
    };
  }

  async trackUsage(usageData) {
    if (!this.config.cost_tracking_enabled) {
      return;
    }

    try {
      const db = require('../config/database').getDatabase();
      
      // Calculate compute cost based on processing time for Ollama
      const computeCost = (usageData.processing_time_ms / 1000) * this.computeCostPerSecond;
      
      // Get token estimates
      const tokens = usageData.estimated_tokens || { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

      const stmt = db.prepare(`
        INSERT INTO ai_usage_tracking (
          provider, model, operation_type, visitor_event_id,
          input_tokens, output_tokens, total_tokens, cost_usd,
          processing_time_ms, success, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        'ollama',
        usageData.model,
        usageData.operation_type,
        usageData.visitor_event_id,
        tokens.input_tokens,
        tokens.output_tokens,
        tokens.total_tokens,
        computeCost,
        usageData.processing_time_ms,
        usageData.success ? 1 : 0,
        usageData.error_message || null,
        new Date().toISOString()
      );

      console.log(`Tracked Ollama usage: ${tokens.total_tokens} tokens (estimated), $${computeCost.toFixed(4)} compute cost`);
    } catch (error) {
      console.error('Error tracking Ollama usage:', error);
    }
  }

  async generateFaceEncoding(imageUrl, faceData) {
    // Use the face cropping service to generate proper embeddings
    const faceCroppingService = require('./faceCroppingService');
    
    try {
      const embeddingResult = await faceCroppingService.generateFaceEmbedding(
        imageUrl, 
        faceData.description
      );
      
      return JSON.stringify(embeddingResult.embedding);
    } catch (error) {
      console.error('Error generating face encoding:', error);
      // Fallback to simple hash
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(imageUrl + JSON.stringify(faceData)).digest('hex');
    }
  }
}

class GoogleGeminiProvider extends BaseAIProvider {
  constructor(config) {
    super(config);
    // Google Gemini pricing model
    this.modelPricing = {
      'gemini-pro-vision': { input: 0.00025, output: 0.00075 }, // per 1K tokens
      'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
      'gemini-1.5-flash': { input: 0.000075, output: 0.0003 }
    };
  }

  async detectFaces(imageUrl, visitorEventId = null) {
    if (!this.config.api_key) {
      throw new Error('Google Gemini API key not configured');
    }

    const startTime = Date.now();
    const model = this.config.gemini_model || 'gemini-pro-vision';

    try {
      // Convert image to base64 if needed
      const imageBase64 = await this.convertImageToBase64(imageUrl);

      const prompt = `Analyze this doorbell camera image comprehensively. Provide:

1. FACE DETECTION: Detect all human faces with exact bounding box coordinates as percentages (x, y, width, height), confidence levels (0-100), detailed descriptions, and quality assessment.

2. OBJECT DETECTION: Identify all significant objects, people, vehicles, packages, animals, etc. with confidence levels.

3. SCENE ANALYSIS: Overall confidence in the analysis and general scene description.

Return ONLY valid JSON in this exact format:
{
  "faces_detected": number,
  "faces": [
    {
      "id": 1,
      "bounding_box": {"x": 25.5, "y": 30.2, "width": 15.8, "height": 20.1},
      "confidence": 85,
      "description": "Adult male, approximately 30-40 years old, clear frontal view",
      "quality": "clear",
      "distinctive_features": ["beard", "glasses"]
    }
  ],
  "objects_detected": [
    {
      "object": "person",
      "confidence": 90,
      "description": "Adult standing at door"
    },
    {
      "object": "package",
      "confidence": 75,
      "description": "Small delivery box on ground"
    }
  ],
  "scene_analysis": {
    "overall_confidence": 85,
    "description": "Clear daytime image of person at front door",
    "lighting": "good",
    "image_quality": "high"
  }
}

If no faces are detected, set faces_detected to 0 and faces to empty array. Always include objects_detected and scene_analysis.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.api_key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      // Track usage and costs
      await this.trackUsage({
        model,
        operation_type: 'face_detection',
        visitor_event_id: visitorEventId,
        input_tokens: data.usageMetadata?.promptTokenCount || 0,
        output_tokens: data.usageMetadata?.candidatesTokenCount || 0,
        processing_time_ms: processingTime,
        success: true
      });

      // Parse and validate the response
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const result = this.parseGeminiResponse(content);
      
      console.log(`Gemini ${model} face detection completed in ${processingTime}ms`);
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Track failed usage
      await this.trackUsage({
        model,
        operation_type: 'face_detection',
        visitor_event_id: visitorEventId,
        processing_time_ms: processingTime,
        success: false,
        error_message: error.message
      });

      console.error('Gemini face detection error:', error);
      throw new Error(`Failed to detect faces with Gemini: ${error.message}`);
    }
  }

  async convertImageToBase64(imageUrl) {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      let imageBuffer;
      
      if (imageUrl.startsWith('/uploads/')) {
        // Local file path
        const imagePath = path.join(__dirname, '..', imageUrl);
        imageBuffer = await fs.readFile(imagePath);
      } else if (imageUrl.startsWith('http')) {
        // Remote URL - download the image
        console.log('Downloading remote image for Gemini:', imageUrl);
        imageBuffer = await this.downloadImage(imageUrl);
      } else {
        // Direct file path
        imageBuffer = await fs.readFile(imageUrl);
      }
      
      return imageBuffer.toString('base64');
    } catch (error) {
      console.error('Error converting image to base64 for Gemini:', error);
      throw error;
    }
  }

  async downloadImage(url) {
    const http = require('http');
    const https = require('https');
    const { URL } = require('url');
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const request = client.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Doorbell-Face-Detection/1.0'
        }
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
          return;
        }
        
        const chunks = [];
        
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`Downloaded image for Gemini: ${buffer.length} bytes`);
          resolve(buffer);
        });
        
        response.on('error', (error) => {
          reject(error);
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Image download timeout'));
      });
    });
  }

  parseGeminiResponse(responseText) {
    try {
      console.log('Raw Gemini response:', responseText);
      
      // Try to extract JSON from the response
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('No JSON found in Gemini response, creating default');
        return {
          faces_detected: 0,
          faces: [],
          objects_detected: [],
          scene_analysis: {
            overall_confidence: 0,
            description: 'No analysis available',
            lighting: 'unknown',
            image_quality: 'unknown'
          }
        };
      }
      
      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      // Validate and normalize the response structure
      return this.validateAndNormalizeResponse(parsed);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        faces_detected: 0,
        faces: [],
        objects_detected: [],
        scene_analysis: {
          overall_confidence: 0,
          description: 'Error in analysis',
          lighting: 'unknown',
          image_quality: 'unknown'
        }
      };
    }
  }

  validateAndNormalizeResponse(parsed) {
    // Use the same validation logic as other providers
    if (typeof parsed.faces_detected !== 'number') {
      parsed.faces_detected = parsed.faces ? parsed.faces.length : 0;
    }
    
    if (!Array.isArray(parsed.faces)) {
      parsed.faces = [];
    }
    
    // Validate each face object
    parsed.faces = parsed.faces.map((face, index) => {
      return {
        id: face.id || index + 1,
        bounding_box: face.bounding_box || { x: 25, y: 25, width: 50, height: 50 },
        confidence: Math.min(100, Math.max(0, face.confidence || 70)),
        description: face.description || 'Person detected',
        quality: face.quality || 'unknown',
        distinctive_features: Array.isArray(face.distinctive_features) ? face.distinctive_features : []
      };
    });
    
    // Validate objects_detected array
    if (!Array.isArray(parsed.objects_detected)) {
      parsed.objects_detected = [];
    }
    
    // Validate each object
    parsed.objects_detected = parsed.objects_detected.map((obj, index) => {
      return {
        object: obj.object || 'unknown',
        confidence: Math.min(100, Math.max(0, obj.confidence || 50)),
        description: obj.description || 'Object detected'
      };
    });
    
    // Validate scene_analysis
    if (!parsed.scene_analysis || typeof parsed.scene_analysis !== 'object') {
      parsed.scene_analysis = {
        overall_confidence: 70,
        description: 'Scene analysis completed',
        lighting: 'unknown',
        image_quality: 'unknown'
      };
    } else {
      parsed.scene_analysis = {
        overall_confidence: Math.min(100, Math.max(0, parsed.scene_analysis.overall_confidence || 70)),
        description: parsed.scene_analysis.description || 'Scene analysis completed',
        lighting: parsed.scene_analysis.lighting || 'unknown',
        image_quality: parsed.scene_analysis.image_quality || 'unknown'
      };
    }
    
    return parsed;
  }

  async trackUsage(usageData) {
    if (!this.config.cost_tracking_enabled) {
      return;
    }

    try {
      const db = require('../config/database').getDatabase();
      
      // Calculate cost based on token usage and model pricing
      const pricing = this.modelPricing[usageData.model] || this.modelPricing['gemini-pro-vision'];
      const inputCost = (usageData.input_tokens / 1000) * pricing.input;
      const outputCost = (usageData.output_tokens / 1000) * pricing.output;
      const totalCost = inputCost + outputCost;

      const stmt = db.prepare(`
        INSERT INTO ai_usage_tracking (
          provider, model, operation_type, visitor_event_id,
          input_tokens, output_tokens, total_tokens, cost_usd,
          processing_time_ms, success, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        'gemini',
        usageData.model,
        usageData.operation_type,
        usageData.visitor_event_id,
        usageData.input_tokens || 0,
        usageData.output_tokens || 0,
        (usageData.input_tokens || 0) + (usageData.output_tokens || 0),
        totalCost,
        usageData.processing_time_ms,
        usageData.success ? 1 : 0,
        usageData.error_message || null,
        new Date().toISOString()
      );

      console.log(`Tracked Gemini usage: ${(usageData.input_tokens || 0) + (usageData.output_tokens || 0)} tokens, $${totalCost.toFixed(4)}`);
    } catch (error) {
      console.error('Error tracking Gemini usage:', error);
    }
  }

  async generateFaceEncoding(imageUrl, faceData) {
    // Use the face cropping service to generate proper embeddings
    const faceCroppingService = require('./faceCroppingService');
    
    try {
      const embeddingResult = await faceCroppingService.generateFaceEmbedding(
        imageUrl, 
        faceData.description
      );
      
      return JSON.stringify(embeddingResult.embedding);
    } catch (error) {
      console.error('Error generating face encoding:', error);
      // Fallback to simple hash
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(imageUrl + JSON.stringify(faceData)).digest('hex');
    }
  }

  // Static method to get available Gemini models
  static async getAvailableModels(apiKey) {
    // Return known Gemini models
    return [
      { 
        value: 'gemini-pro-vision', 
        label: 'Gemini Pro Vision (Recommended)',
        pricing: { input: 0.00025, output: 0.00075 }
      },
      { 
        value: 'gemini-1.5-pro', 
        label: 'Gemini 1.5 Pro (Most Capable)',
        pricing: { input: 0.00125, output: 0.005 }
      },
      { 
        value: 'gemini-1.5-flash', 
        label: 'Gemini 1.5 Flash (Fast & Cost-effective)',
        pricing: { input: 0.000075, output: 0.0003 }
      }
    ];
  }

  // Test API connection
  static async testConnection(apiKey, model = 'gemini-pro-vision') {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Test connection' }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API key validation failed: ${errorData.error?.message || 'Invalid API key'}`);
      }

      return {
        success: true,
        message: 'Gemini API connection successful',
        models_available: true
      };
    } catch (error) {
      return {
        success: false,
        message: `Gemini connection failed: ${error.message}`
      };
    }
  }
}

class GoogleCloudVisionProvider extends BaseAIProvider {
  constructor(config) {
    super(config);
    // Google Cloud Vision pricing: $1.50 per 1K images = $0.0015 per image
    this.costPerImage = 0.0015;
  }

  async detectFaces(imageUrl, visitorEventId = null) {
    if (!this.config.api_key) {
      throw new Error('Google Cloud Vision API key not configured');
    }

    const startTime = Date.now();

    try {
      // Convert image to base64 if needed
      const imageBase64 = await this.convertImageToBase64(imageUrl);

      // Google Cloud Vision Face Detection API
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.config.api_key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: imageBase64
            },
            features: [
              {
                type: 'FACE_DETECTION',
                maxResults: 50
              },
              {
                type: 'OBJECT_LOCALIZATION',
                maxResults: 50
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Google Cloud Vision API error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      // Track usage and costs
      await this.trackUsage({
        operation_type: 'face_detection',
        visitor_event_id: visitorEventId,
        processing_time_ms: processingTime,
        success: true
      });

      // Parse and validate the response
      const result = this.parseGoogleCloudResponse(data.responses[0]);
      
      console.log(`Google Cloud Vision face detection completed in ${processingTime}ms`);
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Track failed usage
      await this.trackUsage({
        operation_type: 'face_detection',
        visitor_event_id: visitorEventId,
        processing_time_ms: processingTime,
        success: false,
        error_message: error.message
      });

      console.error('Google Cloud Vision face detection error:', error);
      throw new Error(`Failed to detect faces with Google Cloud Vision: ${error.message}`);
    }
  }

  async convertImageToBase64(imageUrl) {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      let imageBuffer;
      
      if (imageUrl.startsWith('/uploads/')) {
        // Local file path
        const imagePath = path.join(__dirname, '..', imageUrl);
        imageBuffer = await fs.readFile(imagePath);
      } else if (imageUrl.startsWith('http')) {
        // Remote URL - download the image
        console.log('Downloading remote image for Google Cloud Vision:', imageUrl);
        imageBuffer = await this.downloadImage(imageUrl);
      } else {
        // Direct file path
        imageBuffer = await fs.readFile(imageUrl);
      }
      
      return imageBuffer.toString('base64');
    } catch (error) {
      console.error('Error converting image to base64 for Google Cloud Vision:', error);
      throw error;
    }
  }

  async downloadImage(url) {
    const http = require('http');
    const https = require('https');
    const { URL } = require('url');
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const request = client.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Doorbell-Face-Detection/1.0'
        }
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
          return;
        }
        
        const chunks = [];
        
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`Downloaded image for Google Cloud Vision: ${buffer.length} bytes`);
          resolve(buffer);
        });
        
        response.on('error', (error) => {
          reject(error);
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Image download timeout'));
      });
    });
  }

  parseGoogleCloudResponse(response) {
    try {
      console.log('Raw Google Cloud Vision response:', JSON.stringify(response, null, 2));
      
      const faces = response.faceAnnotations || [];
      const objects = response.localizedObjectAnnotations || [];
      
      // Convert Google Cloud Vision faces to our format
      const convertedFaces = faces.map((face, index) => {
        // Google Cloud Vision provides normalized coordinates (0-1)
        // Convert to percentages (0-100)
        const boundingPoly = face.boundingPoly || face.fdBoundingPoly;
        let boundingBox = { x: 25, y: 25, width: 50, height: 50 }; // default
        
        if (boundingPoly && boundingPoly.vertices && boundingPoly.vertices.length >= 2) {
          const vertices = boundingPoly.vertices;
          const x1 = Math.min(...vertices.map(v => v.x || 0));
          const y1 = Math.min(...vertices.map(v => v.y || 0));
          const x2 = Math.max(...vertices.map(v => v.x || 0));
          const y2 = Math.max(...vertices.map(v => v.y || 0));
          
          // Assume image dimensions for percentage calculation (will be approximate)
          boundingBox = {
            x: (x1 / 1000) * 100, // Rough estimation
            y: (y1 / 1000) * 100,
            width: ((x2 - x1) / 1000) * 100,
            height: ((y2 - y1) / 1000) * 100
          };
        }
        
        // Convert Google's confidence (VERY_LIKELY, LIKELY, etc.) to numeric
        const confidence = this.convertGoogleConfidence(face.detectionConfidence);
        
        return {
          id: index + 1,
          bounding_box: boundingBox,
          confidence: confidence,
          description: `Person detected with ${confidence}% confidence`,
          quality: face.detectionConfidence === 'VERY_LIKELY' ? 'high' : 
                   face.detectionConfidence === 'LIKELY' ? 'good' : 'fair',
          distinctive_features: this.extractGoogleFeatures(face)
        };
      });

      // Convert Google Cloud Vision objects to our format
      const convertedObjects = objects.map((obj, index) => {
        return {
          object: obj.name || 'unknown',
          confidence: Math.round((obj.score || 0.5) * 100),
          description: `${obj.name} detected`
        };
      });

      // Add person objects from face detection
      if (faces.length > 0) {
        convertedObjects.unshift({
          object: 'person',
          confidence: Math.round(faces.reduce((sum, face) => sum + this.convertGoogleConfidence(face.detectionConfidence), 0) / faces.length),
          description: `${faces.length} person(s) detected`
        });
      }

      return {
        faces_detected: faces.length,
        faces: convertedFaces,
        objects_detected: convertedObjects,
        scene_analysis: {
          overall_confidence: faces.length > 0 ? 85 : 70,
          description: faces.length > 0 ? 
            `Detected ${faces.length} face(s) and ${objects.length} object(s)` :
            `Detected ${objects.length} object(s), no faces found`,
          lighting: 'unknown',
          image_quality: faces.length > 0 ? 'good' : 'unknown'
        }
      };
    } catch (error) {
      console.error('Error parsing Google Cloud Vision response:', error);
      return {
        faces_detected: 0,
        faces: [],
        objects_detected: [],
        scene_analysis: {
          overall_confidence: 0,
          description: 'Error in analysis',
          lighting: 'unknown',
          image_quality: 'unknown'
        }
      };
    }
  }

  convertGoogleConfidence(likelihood) {
    // Convert Google's likelihood to numeric confidence
    switch (likelihood) {
      case 'VERY_LIKELY': return 95;
      case 'LIKELY': return 80;
      case 'POSSIBLE': return 60;
      case 'UNLIKELY': return 30;
      case 'VERY_UNLIKELY': return 10;
      default: return 70;
    }
  }

  extractGoogleFeatures(face) {
    const features = [];
    
    // Check for various facial features based on Google's response
    if (face.headwearLikelihood === 'LIKELY' || face.headwearLikelihood === 'VERY_LIKELY') {
      features.push('headwear');
    }
    if (face.joyLikelihood === 'LIKELY' || face.joyLikelihood === 'VERY_LIKELY') {
      features.push('smiling');
    }
    if (face.angerLikelihood === 'LIKELY' || face.angerLikelihood === 'VERY_LIKELY') {
      features.push('angry expression');
    }
    if (face.surpriseLikelihood === 'LIKELY' || face.surpriseLikelihood === 'VERY_LIKELY') {
      features.push('surprised expression');
    }
    
    return features;
  }

  async trackUsage(usageData) {
    if (!this.config.cost_tracking_enabled) {
      return;
    }

    try {
      const db = require('../config/database').getDatabase();
      
      // Google Cloud Vision charges per image
      const totalCost = this.costPerImage;

      const stmt = db.prepare(`
        INSERT INTO ai_usage_tracking (
          provider, model, operation_type, visitor_event_id,
          input_tokens, output_tokens, total_tokens, cost_usd,
          processing_time_ms, success, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        'google-cloud-vision',
        'vision-api',
        usageData.operation_type,
        usageData.visitor_event_id,
        1, // 1 "input token" representing 1 image
        0, // No output tokens for image analysis
        1, // 1 total "token" representing 1 image processed
        totalCost,
        usageData.processing_time_ms,
        usageData.success ? 1 : 0,
        usageData.error_message || null,
        new Date().toISOString()
      );

      console.log(`Tracked Google Cloud Vision usage: 1 image processed, $${totalCost.toFixed(4)}`);
    } catch (error) {
      console.error('Error tracking Google Cloud Vision usage:', error);
    }
  }

  async generateFaceEncoding(imageUrl, faceData) {
    // Use the face cropping service to generate proper embeddings
    const faceCroppingService = require('./faceCroppingService');
    
    try {
      const embeddingResult = await faceCroppingService.generateFaceEmbedding(
        imageUrl, 
        faceData.description
      );
      
      return JSON.stringify(embeddingResult.embedding);
    } catch (error) {
      console.error('Error generating face encoding:', error);
      // Fallback to simple hash
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(imageUrl + JSON.stringify(faceData)).digest('hex');
    }
  }

  // Static method to get available Google Cloud Vision models
  static async getAvailableModels(apiKey) {
    // Google Cloud Vision has a single API, not multiple models
    return [
      { 
        value: 'vision-api', 
        label: 'Google Cloud Vision API',
        pricing: { per_image: 0.0015 }
      }
    ];
  }

  // Test API connection
  static async testConnection(apiKey) {
    try {
      // Test with a simple request
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=' // 1x1 pixel test image
            },
            features: [{
              type: 'FACE_DETECTION',
              maxResults: 1
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API key validation failed: ${errorData.error?.message || 'Invalid API key'}`);
      }

      return {
        success: true,
        message: 'Google Cloud Vision API connection successful',
        models_available: true
      };
    } catch (error) {
      return {
        success: false,
        message: `Google Cloud Vision connection failed: ${error.message}`
      };
    }
  }
}

class ClaudeVisionProvider extends BaseAIProvider {
  constructor(config) {
    super(config);
    // Claude pricing model (Claude 3 Sonnet)
    this.modelPricing = {
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 }, // per 1K tokens
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 }
    };
  }

  async detectFaces(imageUrl, visitorEventId = null) {
    if (!this.config.api_key) {
      throw new Error('Claude API key not configured');
    }

    const startTime = Date.now();
    const model = this.config.claude_model || 'claude-3-sonnet-20240229';

    try {
      // Convert image to base64 if needed
      const imageBase64 = await this.convertImageToBase64(imageUrl);

      const prompt = `Analyze this doorbell camera image comprehensively. Provide:

1. FACE DETECTION: Detect all human faces with exact bounding box coordinates as percentages (x, y, width, height), confidence levels (0-100), detailed descriptions, and quality assessment.

2. OBJECT DETECTION: Identify all significant objects, people, vehicles, packages, animals, etc. with confidence levels.

3. SCENE ANALYSIS: Overall confidence in the analysis and general scene description.

Return ONLY valid JSON in this exact format:
{
  "faces_detected": number,
  "faces": [
    {
      "id": 1,
      "bounding_box": {"x": 25.5, "y": 30.2, "width": 15.8, "height": 20.1},
      "confidence": 85,
      "description": "Adult male, approximately 30-40 years old, clear frontal view",
      "quality": "clear",
      "distinctive_features": ["beard", "glasses"]
    }
  ],
  "objects_detected": [
    {
      "object": "person",
      "confidence": 90,
      "description": "Adult standing at door"
    },
    {
      "object": "package",
      "confidence": 75,
      "description": "Small delivery box on ground"
    }
  ],
  "scene_analysis": {
    "overall_confidence": 85,
    "description": "Clear daytime image of person at front door",
    "lighting": "good",
    "image_quality": "high"
  }
}

If no faces are detected, set faces_detected to 0 and faces to empty array. Always include objects_detected and scene_analysis.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.api_key,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [{
              type: 'text',
              text: prompt
            }, {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64
              }
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Claude API error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      // Track usage and costs
      await this.trackUsage({
        model,
        operation_type: 'face_detection',
        visitor_event_id: visitorEventId,
        input_tokens: data.usage?.input_tokens || 0,
        output_tokens: data.usage?.output_tokens || 0,
        processing_time_ms: processingTime,
        success: true
      });

      // Parse and validate the response
      const content = data.content[0].text;
      const result = this.parseClaudeResponse(content);
      
      console.log(`Claude ${model} face detection completed in ${processingTime}ms`);
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Track failed usage
      await this.trackUsage({
        model,
        operation_type: 'face_detection',
        visitor_event_id: visitorEventId,
        processing_time_ms: processingTime,
        success: false,
        error_message: error.message
      });

      console.error('Claude face detection error:', error);
      throw new Error(`Failed to detect faces with Claude: ${error.message}`);
    }
  }

  async convertImageToBase64(imageUrl) {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      let imageBuffer;
      
      if (imageUrl.startsWith('/uploads/')) {
        // Local file path
        const imagePath = path.join(__dirname, '..', imageUrl);
        imageBuffer = await fs.readFile(imagePath);
      } else if (imageUrl.startsWith('http')) {
        // Remote URL - download the image
        console.log('Downloading remote image for Claude:', imageUrl);
        imageBuffer = await this.downloadImage(imageUrl);
      } else {
        // Direct file path
        imageBuffer = await fs.readFile(imageUrl);
      }
      
      return imageBuffer.toString('base64');
    } catch (error) {
      console.error('Error converting image to base64 for Claude:', error);
      throw error;
    }
  }

  async downloadImage(url) {
    const http = require('http');
    const https = require('https');
    const { URL } = require('url');
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const request = client.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Doorbell-Face-Detection/1.0'
        }
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
          return;
        }
        
        const chunks = [];
        
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`Downloaded image for Claude: ${buffer.length} bytes`);
          resolve(buffer);
        });
        
        response.on('error', (error) => {
          reject(error);
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Image download timeout'));
      });
    });
  }

  parseClaudeResponse(responseText) {
    try {
      console.log('Raw Claude response:', responseText);
      
      // Try to extract JSON from the response
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('No JSON found in Claude response, creating default');
        return {
          faces_detected: 0,
          faces: [],
          objects_detected: [],
          scene_analysis: {
            overall_confidence: 0,
            description: 'No analysis available',
            lighting: 'unknown',
            image_quality: 'unknown'
          }
        };
      }
      
      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      // Validate and normalize the response structure (same as OpenAI/Ollama)
      return this.validateAndNormalizeResponse(parsed);
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return {
        faces_detected: 0,
        faces: [],
        objects_detected: [],
        scene_analysis: {
          overall_confidence: 0,
          description: 'Error in analysis',
          lighting: 'unknown',
          image_quality: 'unknown'
        }
      };
    }
  }

  validateAndNormalizeResponse(parsed) {
    // Validate the response structure (same validation as OpenAI)
    if (typeof parsed.faces_detected !== 'number') {
      parsed.faces_detected = parsed.faces ? parsed.faces.length : 0;
    }
    
    if (!Array.isArray(parsed.faces)) {
      parsed.faces = [];
    }
    
    // Validate each face object
    parsed.faces = parsed.faces.map((face, index) => {
      return {
        id: face.id || index + 1,
        bounding_box: face.bounding_box || { x: 25, y: 25, width: 50, height: 50 },
        confidence: Math.min(100, Math.max(0, face.confidence || 70)),
        description: face.description || 'Person detected',
        quality: face.quality || 'unknown',
        distinctive_features: Array.isArray(face.distinctive_features) ? face.distinctive_features : []
      };
    });
    
    // Validate objects_detected array
    if (!Array.isArray(parsed.objects_detected)) {
      parsed.objects_detected = [];
    }
    
    // Validate each object
    parsed.objects_detected = parsed.objects_detected.map((obj, index) => {
      return {
        object: obj.object || 'unknown',
        confidence: Math.min(100, Math.max(0, obj.confidence || 50)),
        description: obj.description || 'Object detected'
      };
    });
    
    // Validate scene_analysis
    if (!parsed.scene_analysis || typeof parsed.scene_analysis !== 'object') {
      parsed.scene_analysis = {
        overall_confidence: 70,
        description: 'Scene analysis completed',
        lighting: 'unknown',
        image_quality: 'unknown'
      };
    } else {
      parsed.scene_analysis = {
        overall_confidence: Math.min(100, Math.max(0, parsed.scene_analysis.overall_confidence || 70)),
        description: parsed.scene_analysis.description || 'Scene analysis completed',
        lighting: parsed.scene_analysis.lighting || 'unknown',
        image_quality: parsed.scene_analysis.image_quality || 'unknown'
      };
    }
    
    return parsed;
  }

  async trackUsage(usageData) {
    if (!this.config.cost_tracking_enabled) {
      return;
    }

    try {
      const db = require('../config/database').getDatabase();
      
      // Calculate cost based on token usage and model pricing
      const pricing = this.modelPricing[usageData.model] || this.modelPricing['claude-3-sonnet-20240229'];
      const inputCost = (usageData.input_tokens / 1000) * pricing.input;
      const outputCost = (usageData.output_tokens / 1000) * pricing.output;
      const totalCost = inputCost + outputCost;

      const stmt = db.prepare(`
        INSERT INTO ai_usage_tracking (
          provider, model, operation_type, visitor_event_id,
          input_tokens, output_tokens, total_tokens, cost_usd,
          processing_time_ms, success, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        'claude',
        usageData.model,
        usageData.operation_type,
        usageData.visitor_event_id,
        usageData.input_tokens || 0,
        usageData.output_tokens || 0,
        (usageData.input_tokens || 0) + (usageData.output_tokens || 0),
        totalCost,
        usageData.processing_time_ms,
        usageData.success ? 1 : 0,
        usageData.error_message || null,
        new Date().toISOString()
      );

      console.log(`Tracked Claude usage: ${(usageData.input_tokens || 0) + (usageData.output_tokens || 0)} tokens, $${totalCost.toFixed(4)}`);
    } catch (error) {
      console.error('Error tracking Claude usage:', error);
    }
  }

  async generateFaceEncoding(imageUrl, faceData) {
    // Use the face cropping service to generate proper embeddings
    const faceCroppingService = require('./faceCroppingService');
    
    try {
      const embeddingResult = await faceCroppingService.generateFaceEmbedding(
        imageUrl, 
        faceData.description
      );
      
      return JSON.stringify(embeddingResult.embedding);
    } catch (error) {
      console.error('Error generating face encoding:', error);
      // Fallback to simple hash
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(imageUrl + JSON.stringify(faceData)).digest('hex');
    }
  }

  // Static method to get available Claude models
  static async getAvailableModels(apiKey) {
    // Claude doesn't have a models endpoint, so return known models
    return [
      { 
        value: 'claude-3-sonnet-20240229', 
        label: 'Claude 3 Sonnet (Recommended)',
        pricing: { input: 0.003, output: 0.015 }
      },
      { 
        value: 'claude-3-haiku-20240307', 
        label: 'Claude 3 Haiku (Fast & Cost-effective)',
        pricing: { input: 0.00025, output: 0.00125 }
      },
      { 
        value: 'claude-3-opus-20240229', 
        label: 'Claude 3 Opus (Most Capable)',
        pricing: { input: 0.015, output: 0.075 }
      }
    ];
  }

  // Test API connection
  static async testConnection(apiKey, model = 'claude-3-sonnet-20240229') {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          messages: [{
            role: 'user',
            content: 'Test connection'
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API key validation failed: ${errorData.error?.message || 'Invalid API key'}`);
      }

      return {
        success: true,
        message: 'Claude API connection successful',
        models_available: true
      };
    } catch (error) {
      return {
        success: false,
        message: `Claude connection failed: ${error.message}`
      };
    }
  }
}

function createAIProvider(providerType, config) {
  switch (providerType) {
    case 'openai':
      return new OpenAIVisionProvider(config);
    case 'local':
      return new LocalOllamaProvider(config);
    case 'claude':
      return new ClaudeVisionProvider(config);
    case 'gemini':
      return new GoogleGeminiProvider(config);
    case 'google-cloud-vision':
      return new GoogleCloudVisionProvider(config);
    default:
      throw new Error(`Unsupported AI provider: ${providerType}`);
  }
}

module.exports = {
  createAIProvider,
  BaseAIProvider,
  OpenAIVisionProvider,
  LocalOllamaProvider,
  GoogleGeminiProvider,
  GoogleCloudVisionProvider,
  ClaudeVisionProvider
};
