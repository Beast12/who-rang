
const { getDatabase } = require('../config/database');

class VisitorLabelingController {
  // Label a visitor event with a person
  static labelVisitorEvent(req, res) {
    const db = getDatabase();
    const { visitor_event_id, person_id, confidence } = req.body;
    
    if (!visitor_event_id) {
      return res.status(400).json({ error: 'visitor_event_id is required' });
    }
    
    try {
      // Check if visitor event exists
      const eventStmt = db.prepare('SELECT * FROM doorbell_events WHERE id = ?');
      const event = eventStmt.get(visitor_event_id);
      
      if (!event) {
        return res.status(404).json({ error: 'Visitor event not found' });
      }
      
      // If person_id is provided, check if person exists
      if (person_id) {
        const personStmt = db.prepare('SELECT * FROM persons WHERE id = ?');
        const person = personStmt.get(person_id);
        
        if (!person) {
          return res.status(404).json({ error: 'Person not found' });
        }
      }
      
      // Check if labeling already exists
      const existingStmt = db.prepare('SELECT * FROM person_visitor_events WHERE visitor_event_id = ?');
      const existing = existingStmt.get(visitor_event_id);
      
      if (existing) {
        // Update existing labeling
        const updateStmt = db.prepare('UPDATE person_visitor_events SET person_id = ?, confidence = ? WHERE visitor_event_id = ?');
        updateStmt.run(person_id, confidence || null, visitor_event_id);
      } else {
        // Create new labeling
        const insertStmt = db.prepare('INSERT INTO person_visitor_events (person_id, visitor_event_id, confidence) VALUES (?, ?, ?)');
        insertStmt.run(person_id, visitor_event_id, confidence || null);
      }
      
      res.json({ message: 'Visitor event labeled successfully' });
    } catch (err) {
      console.error('Error labeling visitor event:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // Get visitor events with person information
  static getEventsWithPersons(req, res) {
    const db = getDatabase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    try {
      const stmt = db.prepare(`
        SELECT de.*, p.name as person_name, pve.confidence as recognition_confidence
        FROM doorbell_events de
        LEFT JOIN person_visitor_events pve ON de.id = pve.visitor_event_id
        LEFT JOIN persons p ON pve.person_id = p.id
        ORDER BY de.timestamp DESC
        LIMIT ? OFFSET ?
      `);
      
      const events = stmt.all(limit, offset);
      
      // Get total count
      const countStmt = db.prepare('SELECT COUNT(*) as total FROM doorbell_events');
      const { total } = countStmt.get();
      
      res.json({
        events,
        total,
        page,
        limit,
        hasMore: offset + events.length < total
      });
    } catch (err) {
      console.error('Error getting events with persons:', err);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = VisitorLabelingController;
