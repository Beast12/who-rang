const aiProviders = require('../services/aiProviders');
const faceProcessing = require('../services/faceProcessing');

class AnalysisController {
  /**
   * Trigger AI analysis for a visitor
   * POST /api/analysis/trigger
   */
  static async triggerAnalysis(req, res) {
    const db = require('../config/database').getDatabase();
    
    try {
      const { visitor_id } = req.body;
      let targetVisitor;
      
      // Get the visitor to analyze
      if (visitor_id) {
        // Analyze specific visitor
        const stmt = db.prepare('SELECT * FROM doorbell_events WHERE id = ?');
        targetVisitor = stmt.get(visitor_id);
        
        if (!targetVisitor) {
          return res.status(404).json({
            success: false,
            error: 'Visitor not found',
            visitor_id
          });
        }
      } else {
        // Analyze latest visitor
        const stmt = db.prepare('SELECT * FROM doorbell_events ORDER BY timestamp DESC LIMIT 1');
        targetVisitor = stmt.get();
        
        if (!targetVisitor) {
          return res.status(404).json({
            success: false,
            error: 'No visitors found to analyze'
          });
        }
      }
      
      console.log(`Triggering AI analysis for visitor ${targetVisitor.id}`);
      
      // Validate that visitor has an image
      if (!targetVisitor.image_url) {
        return res.status(400).json({
          success: false,
          error: 'Visitor has no image to analyze',
          visitor_id: targetVisitor.id
        });
      }
      
      // Return immediate response and process asynchronously
      res.json({
        success: true,
        message: 'Analysis triggered successfully',
        visitor_id: targetVisitor.id,
        processing: true
      });
      
      // Process analysis asynchronously
      setImmediate(async () => {
        try {
          await AnalysisController._processVisitorAnalysis(targetVisitor);
        } catch (error) {
          console.error(`Failed to process analysis for visitor ${targetVisitor.id}:`, error);
        }
      });
      
    } catch (error) {
      console.error('Error triggering analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
  
  /**
   * Process AI analysis for a visitor
   * @private
   */
  static async _processVisitorAnalysis(visitor) {
    const db = require('../config/database').getDatabase();
    
    try {
      console.log(`Starting AI analysis for visitor ${visitor.id}`);
      
      // Mark as processing
      const markProcessingStmt = db.prepare(`
        UPDATE doorbell_events 
        SET ai_processing_complete = 0 
        WHERE id = ?
      `);
      markProcessingStmt.run(visitor.id);
      
      // Get current AI provider configuration
      const configStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
      const config = configStmt.get();
      const aiProvider = config?.ai_provider || 'local';
      
      console.log(`Using AI provider: ${aiProvider}`);
      
      // Get AI provider instance with full configuration
      const provider = aiProviders.createAIProvider(aiProvider, {
        api_key: config?.api_key,
        ollama_url: config?.ollama_url,
        ollama_model: config?.ollama_model,
        openai_model: config?.openai_model,
        claude_model: config?.claude_model,
        gemini_model: config?.gemini_model,
        cost_tracking_enabled: config?.cost_tracking_enabled
      });
      
      // Perform AI analysis
      const analysisResults = await provider.detectFaces(visitor.image_url, visitor.id);
      
      console.log(`AI analysis completed for visitor ${visitor.id}:`, {
        faces_detected: analysisResults.faces_detected,
        objects_detected: analysisResults.objects_detected?.length || 0,
        confidence: analysisResults.scene_analysis?.overall_confidence
      });
      
      // Update visitor with new analysis results
      const updateStmt = db.prepare(`
        UPDATE doorbell_events SET
          ai_message = ?,
          ai_title = ?,
          ai_confidence_score = ?,
          ai_objects_detected = ?,
          ai_scene_analysis = ?,
          ai_processing_complete = 1,
          faces_detected = ?
        WHERE id = ?
      `);
      
      updateStmt.run(
        analysisResults.ai_message || visitor.ai_message,
        analysisResults.ai_title || visitor.ai_title,
        analysisResults.scene_analysis?.overall_confidence || null,
        JSON.stringify(analysisResults.objects_detected || []),
        JSON.stringify(analysisResults.scene_analysis || {}),
        analysisResults.faces_detected || 0,
        visitor.id
      );
      
      // Process faces if detected
      if (analysisResults.faces_detected > 0 && analysisResults.faces) {
        console.log(`Processing ${analysisResults.faces_detected} faces for visitor ${visitor.id}`);
        
        try {
          await faceProcessing.processVisitorEvent(
            visitor.id,
            visitor.image_url
          );
        } catch (faceError) {
          console.error(`Face processing failed for visitor ${visitor.id}:`, faceError);
          // Continue even if face processing fails
        }
      }
      
      // Send WebSocket notification about analysis completion
      const WebSocketHandler = require('../websocket/handler');
      if (WebSocketHandler.broadcast) {
        WebSocketHandler.broadcast({
          type: 'ai_analysis_complete',
          data: {
            visitor_id: visitor.id,
            ai_provider: aiProvider,
            faces_detected: analysisResults.faces_detected || 0,
            objects_detected: analysisResults.objects_detected?.length || 0,
            confidence_score: analysisResults.scene_analysis?.overall_confidence,
            processing_time: Date.now() - new Date(visitor.timestamp).getTime(),
            cost_usd: analysisResults.cost_usd || 0
          }
        });
      }
      
      console.log(`Analysis processing completed for visitor ${visitor.id}`);
      
    } catch (error) {
      console.error(`Error processing analysis for visitor ${visitor.id}:`, error);
      
      // Mark as failed
      const failStmt = db.prepare(`
        UPDATE doorbell_events 
        SET ai_processing_complete = 1 
        WHERE id = ?
      `);
      failStmt.run(visitor.id);
      
      // Send error notification via WebSocket
      const WebSocketHandler = require('../websocket/handler');
      if (WebSocketHandler.broadcast) {
        WebSocketHandler.broadcast({
          type: 'ai_analysis_error',
          data: {
            visitor_id: visitor.id,
            error: error.message
          }
        });
      }
    }
  }
  
  /**
   * Get analysis status for a visitor
   * GET /api/analysis/status/:visitor_id
   */
  static async getAnalysisStatus(req, res) {
    const db = require('../config/database').getDatabase();
    
    try {
      const { visitor_id } = req.params;
      
      const stmt = db.prepare(`
        SELECT 
          id,
          ai_processing_complete,
          ai_confidence_score,
          faces_detected,
          ai_objects_detected,
          ai_scene_analysis
        FROM doorbell_events 
        WHERE id = ?
      `);
      
      const visitor = stmt.get(visitor_id);
      
      if (!visitor) {
        return res.status(404).json({
          success: false,
          error: 'Visitor not found'
        });
      }
      
      res.json({
        success: true,
        visitor_id: visitor.id,
        processing_complete: Boolean(visitor.ai_processing_complete),
        confidence_score: visitor.ai_confidence_score,
        faces_detected: visitor.faces_detected || 0,
        objects_detected: visitor.ai_objects_detected ? 
          JSON.parse(visitor.ai_objects_detected).length : 0,
        scene_analysis: visitor.ai_scene_analysis ? 
          JSON.parse(visitor.ai_scene_analysis) : null
      });
      
    } catch (error) {
      console.error('Error getting analysis status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

module.exports = AnalysisController;
