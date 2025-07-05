const { getDatabase } = require('../config/database');
const faceProcessingService = require('../services/faceProcessing');

class DetectedFacesController {
  // Get all unassigned faces (for manual labeling)
  static async getUnassignedFaces(req, res) {
    try {
      const db = getDatabase();
      const { limit = 50, offset = 0, quality_threshold = 0 } = req.query;
      
      const stmt = db.prepare(`
        SELECT df.*, de.timestamp, de.ai_title, de.image_url as original_image
        FROM detected_faces df
        JOIN doorbell_events de ON df.visitor_event_id = de.id
        WHERE df.person_id IS NULL 
        AND df.quality_score >= ?
        ORDER BY df.created_at DESC
        LIMIT ? OFFSET ?
      `);
      
      const faces = stmt.all(quality_threshold, limit, offset);
      
      // Get total count
      const countStmt = db.prepare(`
        SELECT COUNT(*) as total
        FROM detected_faces df
        WHERE df.person_id IS NULL 
        AND df.quality_score >= ?
      `);
      const { total } = countStmt.get(quality_threshold);
      
      res.json({
        faces,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      });
    } catch (error) {
      console.error('Error getting unassigned faces:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get faces for a specific person
  static async getPersonFaces(req, res) {
    try {
      const { personId } = req.params;
      const db = getDatabase();
      
      const stmt = db.prepare(`
        SELECT df.*, de.timestamp, de.ai_title, de.image_url as original_image
        FROM detected_faces df
        JOIN doorbell_events de ON df.visitor_event_id = de.id
        WHERE df.person_id = ?
        ORDER BY df.created_at DESC
      `);
      
      const faces = stmt.all(personId);
      
      res.json({ faces });
    } catch (error) {
      console.error('Error getting person faces:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Assign a face to a person (manual labeling)
  static async assignFaceToPerson(req, res) {
    try {
      const { faceId } = req.params;
      const { personId } = req.body;
      
      if (!personId) {
        return res.status(400).json({ error: 'Person ID is required' });
      }
      
      const db = getDatabase();
      
      // Check if person exists
      const personStmt = db.prepare('SELECT * FROM persons WHERE id = ?');
      const person = personStmt.get(personId);
      
      if (!person) {
        return res.status(404).json({ error: 'Person not found' });
      }
      
      // Check if face exists
      const faceStmt = db.prepare('SELECT * FROM detected_faces WHERE id = ?');
      const face = faceStmt.get(faceId);
      
      if (!face) {
        return res.status(404).json({ error: 'Face not found' });
      }
      
      // Assign face to person
      await faceProcessingService.assignFaceToPerson(faceId, personId, face.confidence, true);
      
      // Update person statistics
      await faceProcessingService.updatePersonStats(personId);
      
      res.json({ 
        message: 'Face assigned successfully',
        faceId,
        personId,
        personName: person.name
      });
    } catch (error) {
      console.error('Error assigning face to person:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Unassign a face from a person
  static async unassignFace(req, res) {
    try {
      const { faceId } = req.params;
      const db = getDatabase();
      
      // Check if face exists
      const faceStmt = db.prepare('SELECT * FROM detected_faces WHERE id = ?');
      const face = faceStmt.get(faceId);
      
      if (!face) {
        return res.status(404).json({ error: 'Face not found' });
      }
      
      const oldPersonId = face.person_id;
      
      // Unassign face
      const updateStmt = db.prepare(`
        UPDATE detected_faces 
        SET person_id = NULL, assigned_manually = 0, assigned_at = NULL
        WHERE id = ?
      `);
      updateStmt.run(faceId);
      
      // Update person statistics if there was a previous assignment
      if (oldPersonId) {
        await faceProcessingService.updatePersonStats(oldPersonId);
      }
      
      res.json({ 
        message: 'Face unassigned successfully',
        faceId
      });
    } catch (error) {
      console.error('Error unassigning face:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Bulk assign multiple faces to a person
  static async bulkAssignFaces(req, res) {
    try {
      const { faceIds, personId } = req.body;
      
      if (!Array.isArray(faceIds) || faceIds.length === 0) {
        return res.status(400).json({ error: 'Face IDs array is required' });
      }
      
      if (!personId) {
        return res.status(400).json({ error: 'Person ID is required' });
      }
      
      const db = getDatabase();
      
      // Check if person exists
      const personStmt = db.prepare('SELECT * FROM persons WHERE id = ?');
      const person = personStmt.get(personId);
      
      if (!person) {
        return res.status(404).json({ error: 'Person not found' });
      }
      
      let assignedCount = 0;
      const errors = [];
      
      // Assign each face
      for (const faceId of faceIds) {
        try {
          const faceStmt = db.prepare('SELECT * FROM detected_faces WHERE id = ?');
          const face = faceStmt.get(faceId);
          
          if (face) {
            await faceProcessingService.assignFaceToPerson(faceId, personId, face.confidence, true);
            assignedCount++;
          } else {
            errors.push(`Face ${faceId} not found`);
          }
        } catch (error) {
          errors.push(`Error assigning face ${faceId}: ${error.message}`);
        }
      }
      
      // Update person statistics
      if (assignedCount > 0) {
        await faceProcessingService.updatePersonStats(personId);
      }
      
      res.json({ 
        message: `${assignedCount} faces assigned successfully`,
        assignedCount,
        totalRequested: faceIds.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error bulk assigning faces:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get face similarity suggestions for a specific face
  static async getFaceSimilarities(req, res) {
    try {
      const { faceId } = req.params;
      const { threshold = 0.6, limit = 10 } = req.query;
      
      const db = getDatabase();
      const faceCroppingService = require('../services/faceCroppingService');
      
      // Get the target face
      const targetFaceStmt = db.prepare('SELECT * FROM detected_faces WHERE id = ?');
      const targetFace = targetFaceStmt.get(faceId);
      
      if (!targetFace || !targetFace.embedding_data) {
        return res.status(404).json({ error: 'Face not found or no embedding data' });
      }
      
      const targetEmbedding = JSON.parse(targetFace.embedding_data);
      
      // Get all other faces with embeddings
      const otherFacesStmt = db.prepare(`
        SELECT df.*, p.name as person_name
        FROM detected_faces df
        LEFT JOIN persons p ON df.person_id = p.id
        WHERE df.id != ? AND df.embedding_data IS NOT NULL
        ORDER BY df.created_at DESC
      `);
      
      const otherFaces = otherFacesStmt.all(faceId);
      
      // Calculate similarities
      const similarities = [];
      
      for (const face of otherFaces) {
        try {
          const faceEmbedding = JSON.parse(face.embedding_data);
          const similarity = faceCroppingService.calculateEmbeddingSimilarity(targetEmbedding, faceEmbedding);
          
          if (similarity >= threshold) {
            similarities.push({
              ...face,
              similarity: similarity
            });
          }
        } catch (error) {
          console.error(`Error calculating similarity for face ${face.id}:`, error);
        }
      }
      
      // Sort by similarity (highest first) and limit results
      similarities.sort((a, b) => b.similarity - a.similarity);
      const limitedSimilarities = similarities.slice(0, parseInt(limit));
      
      res.json({
        targetFace,
        similarities: limitedSimilarities,
        totalFound: similarities.length
      });
    } catch (error) {
      console.error('Error getting face similarities:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Delete a detected face
  static async deleteFace(req, res) {
    try {
      const { faceId } = req.params;
      const db = getDatabase();
      const fs = require('fs').promises;
      const path = require('path');
      
      // Get face details before deletion
      const faceStmt = db.prepare('SELECT * FROM detected_faces WHERE id = ?');
      const face = faceStmt.get(faceId);
      
      if (!face) {
        return res.status(404).json({ error: 'Face not found' });
      }
      
      const oldPersonId = face.person_id;
      
      // Delete face files
      try {
        if (face.face_crop_path) {
          const facePath = path.join(__dirname, '..', face.face_crop_path);
          await fs.unlink(facePath);
        }
        if (face.thumbnail_path) {
          const thumbPath = path.join(__dirname, '..', face.thumbnail_path);
          await fs.unlink(thumbPath);
        }
      } catch (fileError) {
        console.error('Error deleting face files:', fileError);
        // Continue with database deletion even if file deletion fails
      }
      
      // Delete from database
      const deleteStmt = db.prepare('DELETE FROM detected_faces WHERE id = ?');
      deleteStmt.run(faceId);
      
      // Update person statistics if face was assigned
      if (oldPersonId) {
        await faceProcessingService.updatePersonStats(oldPersonId);
      }
      
      res.json({ 
        message: 'Face deleted successfully',
        faceId
      });
    } catch (error) {
      console.error('Error deleting face:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get face detection statistics
  static async getFaceStats(req, res) {
    try {
      const db = getDatabase();
      
      // Total faces detected
      const totalStmt = db.prepare('SELECT COUNT(*) as total FROM detected_faces');
      const { total } = totalStmt.get();
      
      // Assigned vs unassigned
      const assignedStmt = db.prepare('SELECT COUNT(*) as assigned FROM detected_faces WHERE person_id IS NOT NULL');
      const { assigned } = assignedStmt.get();
      const unassigned = total - assigned;
      
      // Quality distribution
      const qualityStmt = db.prepare(`
        SELECT 
          CASE 
            WHEN quality_score >= 0.8 THEN 'high'
            WHEN quality_score >= 0.6 THEN 'medium'
            ELSE 'low'
          END as quality_level,
          COUNT(*) as count
        FROM detected_faces
        GROUP BY quality_level
      `);
      const qualityDistribution = qualityStmt.all();
      
      // Recent activity (last 7 days)
      const recentStmt = db.prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM detected_faces
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      const recentActivity = recentStmt.all();
      
      res.json({
        total,
        assigned,
        unassigned,
        qualityDistribution,
        recentActivity
      });
    } catch (error) {
      console.error('Error getting face stats:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DetectedFacesController;
