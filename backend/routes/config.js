
const express = require('express');
const router = express.Router();

// Get webhook configuration
router.get('/webhook', (req, res) => {
  const db = require('../config/database').getDatabase();
  const PUBLIC_URL = process.env.PUBLIC_URL || process.env.CORS_ORIGIN || 'http://localhost:8080';
  const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || null;
  const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/api/webhook/doorbell';

  try {
    const stmt = db.prepare('SELECT webhook_token, webhook_url, webhook_path FROM webhook_config LIMIT 1');
    const config = stmt.get();
    
    const webhookPath = config?.webhook_path || WEBHOOK_PATH;
    const webhookUrl = `${PUBLIC_URL}${webhookPath}`;
    
    res.json({
      webhook_url: webhookUrl,
      webhook_path: webhookPath,
      has_token: !!(config?.webhook_token || WEBHOOK_TOKEN),
      webhook_token: config?.webhook_token ? '***' : null,
      public_url: PUBLIC_URL
    });
  } catch (err) {
    console.error('Error getting webhook config:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update webhook configuration
router.put('/webhook', (req, res) => {
  const { webhook_token, webhook_path } = req.body;
  const db = require('../config/database').getDatabase();
  const PUBLIC_URL = process.env.PUBLIC_URL || process.env.CORS_ORIGIN || 'http://localhost:8080';
  const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/api/webhook/doorbell';
  
  try {
    const stmt = db.prepare('SELECT id FROM webhook_config LIMIT 1');
    const existing = stmt.get();
    
    const finalWebhookPath = webhook_path || WEBHOOK_PATH;
    const webhookUrl = `${PUBLIC_URL}${finalWebhookPath}`;
    
    if (existing) {
      const updateStmt = db.prepare(`
        UPDATE webhook_config 
        SET webhook_token = ?, webhook_path = ?, webhook_url = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      updateStmt.run(webhook_token, finalWebhookPath, webhookUrl, existing.id);
    } else {
      const insertStmt = db.prepare(`
        INSERT INTO webhook_config (webhook_token, webhook_path, webhook_url)
        VALUES (?, ?, ?)
      `);
      insertStmt.run(webhook_token, finalWebhookPath, webhookUrl);
    }
    
    res.json({ 
      message: 'Webhook configuration updated successfully',
      webhook_url: webhookUrl,
      webhook_path: finalWebhookPath
    });
  } catch (err) {
    console.error('Error updating webhook config:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test webhook endpoint
router.post('/webhook/test', (req, res) => {
  const testPayload = {
    ai_message: "Test visitor at the front door - this is a test notification",
    ai_title: "Test Notification",
    location: "Front Door",
    weather: "clear"
  };

  try {
    const { v4: uuidv4 } = require('uuid');
    const { broadcast } = require('../websocket/handler');
    
    // Simulate webhook processing
    const newEvent = {
      visitor_id: uuidv4(),
      timestamp: new Date().toISOString(),
      ai_message: testPayload.ai_message,
      ai_title: testPayload.ai_title,
      image_url: '/placeholder.svg',
      location: testPayload.location,
      weather: testPayload.weather
    };

    // Broadcast test event
    broadcast({
      type: 'new_visitor',
      data: { ...newEvent, id: 'test-' + Date.now() }
    });

    res.json({ 
      message: 'Test webhook sent successfully',
      test_payload: testPayload
    });
  } catch (err) {
    console.error('Error sending test webhook:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
