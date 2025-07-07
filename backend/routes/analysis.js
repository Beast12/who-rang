const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// Trigger AI analysis for a visitor
router.post('/trigger', analysisController.triggerAnalysis);

// Get analysis status for a visitor
router.get('/status/:visitor_id', analysisController.getAnalysisStatus);

module.exports = router;
