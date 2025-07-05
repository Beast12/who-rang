
const express = require('express');
const router = express.Router();
const fs = require('fs');

// Get database statistics
router.get('/stats', (req, res) => {
  const db = require('../config/database').getDatabase();
  
  try {
    // Get total events count
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM doorbell_events');
    const totalCount = totalStmt.get().count;
    
    // Get database file size
    const DATABASE_PATH = process.env.DATABASE_PATH || './doorbell.db';
    let dbSize = 0;
    try {
      const stats = fs.statSync(DATABASE_PATH);
      dbSize = stats.size;
    } catch (err) {
      console.log('Could not get database file size:', err.message);
    }
    
    // Convert bytes to MB
    const dbSizeMB = (dbSize / (1024 * 1024)).toFixed(2);
    
    res.json({
      totalEvents: totalCount,
      databaseSize: `${dbSizeMB} MB`
    });
  } catch (err) {
    console.error('Error getting database stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// Clear database
router.post('/clear', (req, res) => {
  const db = require('../config/database').getDatabase();
  
  try {
    // Clear all visitor events
    const deleteStmt = db.prepare('DELETE FROM doorbell_events');
    const result = deleteStmt.run();
    
    // Broadcast database cleared event to all WebSocket clients
    const { broadcast } = require('../websocket/handler');
    broadcast({
      type: 'database_cleared',
      data: { 
        deletedCount: result.changes,
        timestamp: new Date().toISOString()
      }
    });
    
    res.json({ 
      message: 'Database cleared successfully',
      deletedCount: result.changes
    });
  } catch (err) {
    console.error('Error clearing database:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
