
const { getDatabase } = require('../config/database');
const faceProcessingService = require('../services/faceProcessing');

class FaceDetectionController {
  // Manually process image for face detection
  static async detectFaces(req, res) {
    try {
      const { visitor_event_id } = req.body;
      
      if (!req.file && !visitor_event_id) {
        return res.status(400).json({ error: 'Either image file or visitor_event_id is required' });
      }
      
      let imageUrl;
      let eventId;
      
      if (req.file) {
        imageUrl = `/uploads/faces/${req.file.filename}`;
        eventId = null;
      } else {
        // Get image from visitor event
        const db = getDatabase();
        const stmt = db.prepare('SELECT id, image_url FROM doorbell_events WHERE id = ?');
        const event = stmt.get(visitor_event_id);
        
        if (!event) {
          return res.status(404).json({ error: 'Visitor event not found' });
        }
        
        imageUrl = event.image_url;
        eventId = event.id;
      }
      
      // Add to processing queue
      await faceProcessingService.addToProcessingQueue(eventId, imageUrl);
      
      res.json({ 
        message: 'Face detection queued for processing',
        imageUrl,
        eventId
      });
    } catch (error) {
      console.error('Face detection error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Train person with images
  static async trainPerson(req, res) {
    try {
      const personId = req.params.personId;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'At least one training image is required' });
      }
      
      // Check if person exists
      const db = getDatabase();
      const personStmt = db.prepare('SELECT * FROM persons WHERE id = ?');
      const person = personStmt.get(personId);
      
      if (!person) {
        return res.status(404).json({ error: 'Person not found' });
      }
      
      // Process training images
      const imageUrls = req.files.map(file => `/uploads/faces/${file.filename}`);
      
      await faceProcessingService.trainPersonWithImages(parseInt(personId), imageUrls);
      
      res.json({ 
        message: 'Person training completed',
        personId,
        imagesProcessed: imageUrls.length
      });
    } catch (error) {
      console.error('Training error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get processing queue status
  static getProcessingStatus(req, res) {
    res.json({
      queueLength: faceProcessingService.processingQueue.length,
      isProcessing: faceProcessingService.isProcessing
    });
  }
}

module.exports = FaceDetectionController;
