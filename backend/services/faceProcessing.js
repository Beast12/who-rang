
const { createAIProvider } = require('./aiProviders');
const { broadcast } = require('../websocket/handler');

// Try to load the full face cropping service, fall back to lite version if canvas is not available
let faceCroppingService;
try {
  faceCroppingService = require('./faceCroppingService');
  console.log('Using full face cropping service with canvas');
} catch (error) {
  console.log('Canvas not available, using lite face cropping service:', error.message);
  faceCroppingService = require('./faceCroppingServiceLite');
}

class FaceProcessingService {
  constructor() {
    this.processingQueue = [];
    this.isProcessing = false;
  }

  async processVisitorEvent(eventId, imageUrl) {
    const db = require('../config/database').getDatabase();
    
    try {
      // Get face recognition config
      const configStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
      const config = configStmt.get();
      
      if (!config || !config.enabled) {
        console.log('Face recognition disabled, skipping processing');
        return;
      }

      // Create AI provider with full config
      const aiProvider = createAIProvider(config.ai_provider, {
        api_key: config.api_key,
        ollama_url: config.ollama_url,
        ollama_model: config.ollama_model,
        openai_model: config.openai_model,
        claude_model: config.claude_model,
        cost_tracking_enabled: config.cost_tracking_enabled
      });

      console.log(`Processing face detection for event ${eventId} with ${config.ai_provider}`);

      // Detect faces and analyze scene comprehensively
      const analysisResults = await aiProvider.detectFaces(imageUrl, eventId);
      
      // Update visitor event with comprehensive AI analysis
      const updateEventStmt = db.prepare(`
        UPDATE doorbell_events 
        SET faces_detected = ?, faces_processed = 1, 
            ai_confidence_score = ?, ai_objects_detected = ?, 
            ai_scene_analysis = ?, ai_processing_complete = 1
        WHERE id = ?
      `);
      updateEventStmt.run(
        analysisResults.faces_detected, 
        analysisResults.scene_analysis?.overall_confidence || null,
        JSON.stringify(analysisResults.objects_detected || []),
        JSON.stringify(analysisResults.scene_analysis || {}),
        eventId
      );
      
      if (analysisResults.faces_detected > 0) {
        console.log(`Found ${analysisResults.faces_detected} faces in event ${eventId}`);
        
        // Extract face crops from the image
        const faceCrops = await faceCroppingService.extractFaceCrops(
          imageUrl, 
          analysisResults.faces, 
          eventId
        );
        
        // Process each detected face
        for (let i = 0; i < analysisResults.faces.length; i++) {
          const face = analysisResults.faces[i];
          const faceCrop = faceCrops[i];
          
          if (!faceCrop) {
            console.log(`Skipping face ${i + 1} - crop extraction failed`);
            continue;
          }
          
          try {
            // Generate face embedding
            const embeddingResult = await faceCroppingService.generateFaceEmbedding(
              faceCrop.faceCropPath, 
              face.description
            );
            
            // Store the detected face in database
            const insertFaceStmt = db.prepare(`
              INSERT INTO detected_faces (
                visitor_event_id, face_crop_path, thumbnail_path, bounding_box,
                confidence, quality_score, embedding_data, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            const faceId = insertFaceStmt.run(
              eventId,
              faceCrop.faceCropPath,
              faceCrop.thumbnailPath,
              JSON.stringify(faceCrop.boundingBox),
              face.confidence,
              faceCrop.qualityScore,
              JSON.stringify(embeddingResult.embedding),
              new Date().toISOString()
            ).lastInsertRowid;
            
            console.log(`Stored face ${faceId} for event ${eventId}`);
            
            // Try to match against existing persons if confidence is high enough
            if (face.confidence >= (config.confidence_threshold * 100)) {
              const matchedPerson = await this.matchFaceToPersons(
                embeddingResult.embedding, 
                config.confidence_threshold
              );
              
              if (matchedPerson) {
                // Auto-assign face to matched person
                await this.assignFaceToPerson(faceId, matchedPerson.id, matchedPerson.similarity, false);
                
                // Update person statistics
                await this.updatePersonStats(matchedPerson.id);
                
                // Broadcast recognition result
                broadcast({
                  type: 'face_recognized',
                  data: {
                    eventId,
                    faceId,
                    personId: matchedPerson.id,
                    personName: matchedPerson.name,
                    confidence: face.confidence,
                    similarity: matchedPerson.similarity
                  }
                });
                
                console.log(`Auto-assigned face ${faceId} to person ${matchedPerson.name} (${matchedPerson.similarity.toFixed(2)} similarity)`);
              } else {
                // Broadcast unknown face detected
                broadcast({
                  type: 'unknown_face_detected',
                  data: {
                    eventId,
                    faceId,
                    confidence: face.confidence,
                    qualityScore: faceCrop.qualityScore,
                    thumbnailPath: faceCrop.thumbnailPath,
                    requiresLabeling: true
                  }
                });
                
                console.log(`Unknown face ${faceId} detected, requires manual labeling`);
              }
            } else {
              console.log(`Face ${faceId} confidence too low (${face.confidence}%), skipping auto-matching`);
              
              // Still broadcast as unknown face for manual review
              broadcast({
                type: 'unknown_face_detected',
                data: {
                  eventId,
                  faceId,
                  confidence: face.confidence,
                  qualityScore: faceCrop.qualityScore,
                  thumbnailPath: faceCrop.thumbnailPath,
                  requiresLabeling: true
                }
              });
            }
          } catch (error) {
            console.error(`Error processing face ${i + 1} for event ${eventId}:`, error);
          }
        }
        
        // Broadcast processing complete
        broadcast({
          type: 'face_processing_complete',
          data: {
            eventId,
            facesDetected: analysisResults.faces_detected,
            facesProcessed: faceCrops.length,
            objectsDetected: analysisResults.objects_detected?.length || 0,
            sceneAnalysis: analysisResults.scene_analysis
          }
        });
      } else {
        console.log(`No faces detected in event ${eventId}`);
      }
    } catch (error) {
      console.error('Face processing error:', error);
      
      // Mark event as processed even if failed
      try {
        const updateEventStmt = db.prepare(`
          UPDATE doorbell_events 
          SET faces_processed = 1 
          WHERE id = ?
        `);
        updateEventStmt.run(eventId);
      } catch (dbError) {
        console.error('Error updating event after processing failure:', dbError);
      }
      
      // Broadcast error but don't fail the visitor event
      broadcast({
        type: 'face_processing_error',
        data: {
          eventId,
          error: error.message
        }
      });
    }
  }

  async matchFaceToPersons(embedding, threshold) {
    const db = require('../config/database').getDatabase();
    
    try {
      // Get all existing face embeddings from detected_faces table
      const stmt = db.prepare(`
        SELECT df.*, p.name, p.id as person_id
        FROM detected_faces df
        JOIN persons p ON df.person_id = p.id
        WHERE df.person_id IS NOT NULL AND df.embedding_data IS NOT NULL
      `);
      
      const existingFaces = stmt.all();
      
      let bestMatch = null;
      let bestSimilarity = 0;
      
      // Compare against all existing face embeddings
      for (const existingFace of existingFaces) {
        try {
          const existingEmbedding = JSON.parse(existingFace.embedding_data);
          const similarity = faceCroppingService.calculateEmbeddingSimilarity(embedding, existingEmbedding);
          
          if (similarity >= threshold && similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = {
              id: existingFace.person_id,
              name: existingFace.name,
              similarity: similarity
            };
          }
        } catch (error) {
          console.error('Error parsing embedding data:', error);
        }
      }
      
      return bestMatch;
    } catch (error) {
      console.error('Face matching error:', error);
      return null;
    }
  }

  async assignFaceToPerson(faceId, personId, confidence, isManual = false) {
    const db = require('../config/database').getDatabase();
    
    try {
      // Update the detected face with person assignment
      const updateStmt = db.prepare(`
        UPDATE detected_faces 
        SET person_id = ?, assigned_manually = ?, assigned_at = ?
        WHERE id = ?
      `);
      updateStmt.run(personId, isManual ? 1 : 0, new Date().toISOString(), faceId);
      
      // Record in merge history if manual
      if (isManual) {
        const historyStmt = db.prepare(`
          INSERT INTO face_merge_history (source_face_id, target_person_id, merged_by, confidence)
          VALUES (?, ?, ?, ?)
        `);
        historyStmt.run(faceId, personId, 'system', confidence);
      }
      
      console.log(`Assigned face ${faceId} to person ${personId} (${isManual ? 'manual' : 'automatic'})`);
    } catch (error) {
      console.error('Error assigning face to person:', error);
      throw error;
    }
  }

  async updatePersonStats(personId) {
    const db = require('../config/database').getDatabase();
    
    try {
      // Count faces assigned to this person
      const faceCountStmt = db.prepare(`
        SELECT COUNT(*) as count, AVG(confidence) as avg_confidence,
               MIN(created_at) as first_seen, MAX(created_at) as last_seen
        FROM detected_faces 
        WHERE person_id = ?
      `);
      const stats = faceCountStmt.get(personId);
      
      // Update person statistics
      const updateStmt = db.prepare(`
        UPDATE persons 
        SET face_count = ?, avg_confidence = ?, first_seen = ?, last_seen = ?, updated_at = ?
        WHERE id = ?
      `);
      updateStmt.run(
        stats.count,
        stats.avg_confidence,
        stats.first_seen,
        stats.last_seen,
        new Date().toISOString(),
        personId
      );
      
      console.log(`Updated stats for person ${personId}: ${stats.count} faces, ${stats.avg_confidence?.toFixed(2)} avg confidence`);
    } catch (error) {
      console.error('Error updating person stats:', error);
    }
  }

  calculateSimilarity(encoding1, encoding2) {
    // Use the face cropping service's similarity calculation
    return faceCroppingService.calculateEmbeddingSimilarity(encoding1, encoding2);
  }

  async labelVisitorEvent(eventId, personId, confidence) {
    const db = require('../config/database').getDatabase();
    
    try {
      // Check if labeling already exists
      const existingStmt = db.prepare('SELECT * FROM person_visitor_events WHERE visitor_event_id = ?');
      const existing = existingStmt.get(eventId);
      
      if (existing) {
        // Update existing labeling
        const updateStmt = db.prepare('UPDATE person_visitor_events SET person_id = ?, confidence = ? WHERE visitor_event_id = ?');
        updateStmt.run(personId, confidence, eventId);
      } else {
        // Create new labeling
        const insertStmt = db.prepare('INSERT INTO person_visitor_events (person_id, visitor_event_id, confidence) VALUES (?, ?, ?)');
        insertStmt.run(personId, eventId, confidence);
      }
    } catch (error) {
      console.error('Error labeling visitor event:', error);
      throw error;
    }
  }

  async trainPersonWithImages(personId, imageUrls) {
    const db = require('../config/database').getDatabase();
    
    try {
      // Get face recognition config
      const configStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
      const config = configStmt.get();
      
      if (!config || !config.enabled) {
        throw new Error('Face recognition not enabled');
      }

      const aiProvider = createAIProvider(config.ai_provider, {
        api_key: config.api_key
      });

      // Process each training image
      for (const imageUrl of imageUrls) {
        const faceResults = await aiProvider.detectFaces(imageUrl);
        
        if (faceResults.faces_detected > 0) {
          // Use the first detected face for training
          const face = faceResults.faces[0];
          const encoding = await aiProvider.generateFaceEncoding(imageUrl, face);
          
          // Store the encoding
          const stmt = db.prepare(`
            INSERT INTO face_encodings (person_id, encoding_data, confidence, image_path)
            VALUES (?, ?, ?, ?)
          `);
          stmt.run(personId, encoding, face.confidence, imageUrl);
        }
      }
      
      console.log(`Training completed for person ${personId} with ${imageUrls.length} images`);
    } catch (error) {
      console.error('Training error:', error);
      throw error;
    }
  }

  async addToProcessingQueue(eventId, imageUrl) {
    this.processingQueue.push({ eventId, imageUrl });
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.isProcessing = true;
    
    while (this.processingQueue.length > 0) {
      const { eventId, imageUrl } = this.processingQueue.shift();
      
      try {
        await this.processVisitorEvent(eventId, imageUrl);
      } catch (error) {
        console.error('Queue processing error:', error);
      }
      
      // Add delay to avoid overwhelming AI providers
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.isProcessing = false;
  }
}

// Create singleton instance
const faceProcessingService = new FaceProcessingService();

module.exports = faceProcessingService;
