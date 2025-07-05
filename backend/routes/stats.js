
const express = require('express');
const router = express.Router();

// Get stats
router.get('/', (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const db = require('../config/database').getDatabase();

  try {
    const todayStmt = db.prepare('SELECT COUNT(*) as count FROM doorbell_events WHERE timestamp >= ?');
    const weekStmt = db.prepare('SELECT COUNT(*) as count FROM doorbell_events WHERE timestamp >= ?');
    const monthStmt = db.prepare('SELECT COUNT(*) as count FROM doorbell_events WHERE timestamp >= ?');
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM doorbell_events');

    const todayCount = todayStmt.get(today).count;
    const weekCount = weekStmt.get(weekAgo).count;
    const monthCount = monthStmt.get(monthAgo).count;
    const totalCount = totalStmt.get().count;

    const { getConnectedClients } = require('../websocket/handler');

    res.json({
      today: todayCount,
      week: weekCount,
      month: monthCount,
      total: totalCount,
      peakHour: 14, // Static value, could be calculated
      isOnline: getConnectedClients() > 0,
      connectedClients: getConnectedClients()
    });
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
