
const { getDatabase } = require('../config/database');

class PersonController {
  // Get all persons
  static getPersons(req, res) {
    const db = getDatabase();
    
    try {
      const stmt = db.prepare(`
        SELECT p.*, 
               COUNT(fe.id) as encoding_count,
               COUNT(pve.id) as detection_count
        FROM persons p
        LEFT JOIN face_encodings fe ON p.id = fe.person_id
        LEFT JOIN person_visitor_events pve ON p.id = pve.person_id
        GROUP BY p.id
        ORDER BY p.name
      `);
      
      const persons = stmt.all();
      res.json(persons);
    } catch (err) {
      console.error('Error getting persons:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // Get specific person with encodings
  static getPerson(req, res) {
    const db = getDatabase();
    const personId = req.params.id;
    
    try {
      const personStmt = db.prepare('SELECT * FROM persons WHERE id = ?');
      const person = personStmt.get(personId);
      
      if (!person) {
        return res.status(404).json({ error: 'Person not found' });
      }
      
      const encodingsStmt = db.prepare('SELECT * FROM face_encodings WHERE person_id = ?');
      const encodings = encodingsStmt.all(personId);
      
      const eventsStmt = db.prepare(`
        SELECT de.*, pve.confidence 
        FROM doorbell_events de
        JOIN person_visitor_events pve ON de.id = pve.visitor_event_id
        WHERE pve.person_id = ?
        ORDER BY de.timestamp DESC
        LIMIT 10
      `);
      const recentEvents = eventsStmt.all(personId);
      
      res.json({
        ...person,
        encodings,
        recentEvents
      });
    } catch (err) {
      console.error('Error getting person:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // Create new person
  static createPerson(req, res) {
    const db = getDatabase();
    const { name, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    try {
      const stmt = db.prepare('INSERT INTO persons (name, notes) VALUES (?, ?)');
      const result = stmt.run(name, notes || null);
      
      const newPersonStmt = db.prepare('SELECT * FROM persons WHERE id = ?');
      const newPerson = newPersonStmt.get(result.lastInsertRowid);
      
      res.status(201).json(newPerson);
    } catch (err) {
      console.error('Error creating person:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // Update person
  static updatePerson(req, res) {
    const db = getDatabase();
    const personId = req.params.id;
    const { name, notes } = req.body;
    
    try {
      const stmt = db.prepare('UPDATE persons SET name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const result = stmt.run(name, notes, personId);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Person not found' });
      }
      
      const updatedPersonStmt = db.prepare('SELECT * FROM persons WHERE id = ?');
      const updatedPerson = updatedPersonStmt.get(personId);
      
      res.json(updatedPerson);
    } catch (err) {
      console.error('Error updating person:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // Delete person
  static deletePerson(req, res) {
    const db = getDatabase();
    const personId = req.params.id;
    
    try {
      const stmt = db.prepare('DELETE FROM persons WHERE id = ?');
      const result = stmt.run(personId);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Person not found' });
      }
      
      res.json({ message: 'Person deleted successfully' });
    } catch (err) {
      console.error('Error deleting person:', err);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = PersonController;
