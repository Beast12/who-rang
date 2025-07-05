const express = require('express');
const router = express.Router();

// Get visitors with pagination
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;
  const db = require('../config/database').getDatabase();

  try {
    const searchParam = `%${search}%`;
    
    const stmt = db.prepare(`
      SELECT * FROM doorbell_events 
      WHERE ai_message LIKE ? OR ai_title LIKE ? OR location LIKE ?
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(searchParam, searchParam, searchParam, limit, offset);

    // Get total count
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM doorbell_events 
      WHERE ai_message LIKE ? OR ai_title LIKE ? OR location LIKE ?
    `);
    
    const countRow = countStmt.get(searchParam, searchParam, searchParam);
    const total = countRow.total;
    const hasMore = offset + rows.length < total;

    res.json({
      visitors: rows,
      total,
      page,
      limit,
      hasMore
    });
  } catch (err) {
    console.error('Error getting visitors:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all detected objects with counts (must be before /:id route)
router.get('/detected-objects', (req, res) => {
  const db = require('../config/database').getDatabase();
  
  try {
    // Get all visitors with ai_objects_detected data
    const stmt = db.prepare(`
      SELECT ai_objects_detected 
      FROM doorbell_events 
      WHERE ai_objects_detected IS NOT NULL 
      AND ai_objects_detected != ''
      AND ai_objects_detected != 'null'
    `);
    
    const rows = stmt.all();
    const objectCounts = new Map();
    
    // Parse and aggregate detected objects
    rows.forEach(row => {
      try {
        const objects = JSON.parse(row.ai_objects_detected);
        if (Array.isArray(objects)) {
          objects.forEach(obj => {
            if (obj.object && typeof obj.object === 'string') {
              const objectName = obj.object.toLowerCase().trim();
              if (objectName) {
                const current = objectCounts.get(objectName) || { 
                  name: obj.object, 
                  count: 0, 
                  avgConfidence: 0,
                  totalConfidence: 0
                };
                current.count += 1;
                current.totalConfidence += (obj.confidence || 0);
                current.avgConfidence = current.totalConfidence / current.count;
                objectCounts.set(objectName, current);
              }
            }
          });
        }
      } catch (parseError) {
        console.warn('Failed to parse ai_objects_detected:', parseError);
      }
    });
    
    // Convert to array and sort by count (most common first)
    const detectedObjects = Array.from(objectCounts.values())
      .sort((a, b) => b.count - a.count)
      .map(obj => ({
        object: obj.name,
        count: obj.count,
        avgConfidence: Math.round(obj.avgConfidence * 100) / 100
      }));
    
    res.json({
      objects: detectedObjects,
      total: detectedObjects.length,
      totalDetections: detectedObjects.reduce((sum, obj) => sum + obj.count, 0)
    });
  } catch (err) {
    console.error('Error getting detected objects:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get specific visitor
router.get('/:id', (req, res) => {
  const id = req.params.id;
  const db = require('../config/database').getDatabase();
  
  try {
    const stmt = db.prepare('SELECT * FROM doorbell_events WHERE id = ?');
    const row = stmt.get(id);
    
    if (!row) {
      res.status(404).json({ error: 'Visitor not found' });
      return;
    }
    
    res.json(row);
  } catch (err) {
    console.error('Error getting visitor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete visitor
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const db = require('../config/database').getDatabase();
  
  try {
    const stmt = db.prepare('DELETE FROM doorbell_events WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Visitor not found' });
      return;
    }
    
    res.json({ message: 'Visitor deleted successfully' });
  } catch (err) {
    console.error('Error deleting visitor:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
