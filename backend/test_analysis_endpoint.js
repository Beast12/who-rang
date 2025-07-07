// Simple test to verify the analysis endpoint logic works
const express = require('express');
const cors = require('cors');

// Mock database for testing
const mockDatabase = {
  prepare: (sql) => ({
    get: (id) => {
      if (sql.includes('SELECT * FROM doorbell_events WHERE id')) {
        return {
          id: id || 1,
          image_url: 'https://example.com/test-image.jpg',
          timestamp: new Date().toISOString(),
          ai_message: 'Test visitor detected',
          ai_title: 'Visitor Alert'
        };
      }
      if (sql.includes('SELECT * FROM doorbell_events ORDER BY timestamp DESC')) {
        return {
          id: 1,
          image_url: 'https://example.com/test-image.jpg',
          timestamp: new Date().toISOString(),
          ai_message: 'Latest visitor detected',
          ai_title: 'Latest Visitor Alert'
        };
      }
      if (sql.includes('SELECT * FROM face_recognition_config')) {
        return {
          ai_provider: 'local',
          enabled: true
        };
      }
      return null;
    },
    run: () => ({ lastInsertRowid: 1, changes: 1 }),
    all: () => []
  })
};

// Mock the database module
require.cache[require.resolve('./config/database')] = {
  exports: {
    getDatabase: () => mockDatabase
  }
};

// Mock AI providers
const mockAiProviders = {
  createAIProvider: (provider, config) => ({
    detectFaces: async (imageUrl, eventId) => {
      console.log(`Mock AI analysis for ${provider}: ${imageUrl}`);
      console.log(`Mock AI config:`, config);
      return {
        faces_detected: 1,
        faces: [{
          bounding_box: { x: 10, y: 10, width: 50, height: 50 },
          confidence: 85,
          description: 'Adult male with glasses'
        }],
        objects_detected: [
          { object: 'person', confidence: 90 },
          { object: 'glasses', confidence: 75 }
        ],
        scene_analysis: {
          overall_confidence: 85,
          description: 'Clear daylight image of person at door',
          lighting: 'good',
          image_quality: 'high'
        },
        ai_message: 'Person detected at the door',
        ai_title: 'Visitor Alert',
        cost_usd: 0.001
      };
    }
  })
};

// Mock face processing
const mockFaceProcessing = {
  processVisitorEvent: async (eventId, imageUrl) => {
    console.log(`Mock face processing for event ${eventId}: ${imageUrl}`);
    return true;
  }
};

// Mock WebSocket handler
const mockWebSocketHandler = {
  broadcast: (message) => {
    console.log('Mock WebSocket broadcast:', JSON.stringify(message, null, 2));
  }
};

// Override the requires in the analysis controller
require.cache[require.resolve('./services/aiProviders')] = {
  exports: mockAiProviders
};

require.cache[require.resolve('./services/faceProcessing')] = {
  exports: mockFaceProcessing
};

require.cache[require.resolve('./websocket/handler')] = {
  exports: mockWebSocketHandler
};

// Now load the analysis controller
const AnalysisController = require('./controllers/analysisController');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Add the analysis routes
app.post('/api/analysis/trigger', AnalysisController.triggerAnalysis);
app.get('/api/analysis/status/:visitor_id', AnalysisController.getAnalysisStatus);

// Add a simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the test server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/health');
  console.log('  POST /api/analysis/trigger');
  console.log('  GET  /api/analysis/status/:visitor_id');
  console.log('');
  console.log('Test the analysis endpoint:');
  console.log(`  curl -X POST http://localhost:${PORT}/api/analysis/trigger`);
  console.log(`  curl -X POST http://localhost:${PORT}/api/analysis/trigger -H "Content-Type: application/json" -d '{"visitor_id": "123"}'`);
  console.log(`  curl http://localhost:${PORT}/api/analysis/status/1`);
});
