const express = require('express');
const router = express.Router();
const openaiController = require('../controllers/openaiController');

// Get available OpenAI models
router.get('/models', openaiController.getAllModels);

// Get available models for specific provider
router.get('/models/:provider', openaiController.getProviderModels);

// Get current AI model
router.get('/model/current', openaiController.getCurrentModel);

// Set AI model
router.post('/model', openaiController.setAIModel);

// Test OpenAI API connection
router.post('/test-connection', openaiController.testConnection);

// Get AI usage statistics
router.get('/usage/stats', openaiController.getUsageStats);

// Get AI usage logs
router.get('/usage/logs', openaiController.getUsageLogs);

// Get available AI providers
router.get('/providers', openaiController.getAvailableProviders);

// Set AI provider
router.post('/provider', openaiController.setAIProvider);

module.exports = router;
