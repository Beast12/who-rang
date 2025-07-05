
const express = require('express');
const router = express.Router();

// Import route modules
const visitorsRoutes = require('./visitors');
const statsRoutes = require('./stats');
const databaseRoutes = require('./database');
const configRoutes = require('./config');
const facesRoutes = require('./faces');
const detectedFacesRoutes = require('./detectedFaces');
const openaiRoutes = require('./openai');

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount route modules
router.use('/visitors', visitorsRoutes);
router.use('/stats', statsRoutes);
router.use('/database', databaseRoutes);
router.use('/config', configRoutes);
router.use('/faces', facesRoutes);
router.use('/detected-faces', detectedFacesRoutes);
router.use('/openai', openaiRoutes);

module.exports = router;
