const express = require('express');
const router = express.Router();
const openaiController = require('../controllers/openaiController');

// Get available OpenAI models
router.get('/models', openaiController.getAvailableModels);

// Test OpenAI API connection
router.post('/test-connection', openaiController.testConnection);

// Get AI usage statistics
router.get('/usage/stats', openaiController.getUsageStats);

// Get AI usage logs
router.get('/usage/logs', openaiController.getUsageLogs);

module.exports = router;
