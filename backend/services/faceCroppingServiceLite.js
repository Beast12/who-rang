/**
 * Lightweight face cropping service that works without canvas dependency
 * Falls back to basic functionality when canvas is not available
 */

const fs = require('fs').promises;
const path = require('path');

class FaceCroppingServiceLite {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../uploads');
    this.facesDir = path.join(this.uploadsDir, 'faces');
    this.thumbnailsDir = path.join(this.uploadsDir, 'thumbnails');
    
    // Check if canvas is available
    this.canvasAvailable = this.checkCanvasAvailability();
    
    if (this.canvasAvailable) {
      console.log('Canvas available - full face cropping functionality enabled');
    } else {
      console.log('Canvas not available - using lite face processing mode');
    }
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  checkCanvasAvailability() {
    try {
      require('canvas');
      return true;
    } catch (error) {
      return false;
    }
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.facesDir, { recursive: true });
      await fs.mkdir(this.thumbnailsDir, { recursive: true });
      console.log('Face cropping directories ensured');
    } catch (error) {
      console.error('Error creating face cropping directories:', error);
    }
  }

  /**
   * Extract face crops from a full doorbell image
   * In lite mode, returns face metadata without actual cropping
   */
  async extractFaceCrops(imageUrl, faceDetections, visitorEventId) {
    try {
      console.log(`Processing ${faceDetections.length} face detections for visitor ${visitorEventId}`);
      
      if (this.canvasAvailable) {
        // Use full canvas-based cropping
        const fullService = require('./faceCroppingService');
        return await fullService.extractFaceCrops(imageUrl, faceDetections, visitorEventId);
      } else {
        // Lite mode - return face metadata without actual cropping
        return await this.extractFaceMetadata(imageUrl, faceDetections, visitorEventId);
      }
    } catch (error) {
      console.error('Error in extractFaceCrops:', error);
      // Return basic face metadata even if processing fails
      return await this.extractFaceMetadata(imageUrl, faceDetections, visitorEventId);
    }
  }

  /**
   * Extract face metadata without actual image cropping
   */
  async extractFaceMetadata(imageUrl, faceDetections, visitorEventId) {
    const faceCrops = [];
    
    for (let i = 0; i < faceDetections.length; i++) {
      const face = faceDetections[i];
      const faceId = `${visitorEventId}_face_${i + 1}_${Date.now()}`;
      
      faceCrops.push({
        faceId,
        faceCropPath: null, // No actual crop in lite mode
        thumbnailPath: null, // No thumbnail in lite mode
        boundingBox: face.bounding_box,
        confidence: face.confidence,
        qualityScore: this.calculateFaceQuality(face, 1920, 1080), // Assume standard resolution
        originalFace: face,
        liteMode: true // Flag to indicate this is lite mode processing
      });
      
      console.log(`Face metadata ${i + 1} processed: ${faceId}`);
    }
    
    return faceCrops;
  }

  /**
   * Calculate face quality score based on various factors
   */
  calculateFaceQuality(face, imageWidth = 1920, imageHeight = 1080) {
    let qualityScore = 0.5; // Base score
    
    // Size factor - larger faces are generally better quality
    const faceArea = (face.bounding_box.width / 100) * (face.bounding_box.height / 100);
    const sizeScore = Math.min(faceArea * 10, 1); // Normalize to 0-1
    qualityScore += sizeScore * 0.3;
    
    // Confidence factor
    const confidenceScore = face.confidence / 100;
    qualityScore += confidenceScore * 0.4;
    
    // Position factor - faces in center are often better quality
    const centerX = 50;
    const centerY = 50;
    const faceX = face.bounding_box.x + (face.bounding_box.width / 2);
    const faceY = face.bounding_box.y + (face.bounding_box.height / 2);
    
    const distanceFromCenter = Math.sqrt(
      Math.pow(faceX - centerX, 2) + Math.pow(faceY - centerY, 2)
    );
    const positionScore = Math.max(0, 1 - (distanceFromCenter / 50));
    qualityScore += positionScore * 0.2;
    
    // Quality indicators from face description
    if (face.quality === 'clear') qualityScore += 0.1;
    if (face.description && face.description.includes('frontal')) qualityScore += 0.1;
    if (face.description && face.description.includes('profile')) qualityScore -= 0.1;
    if (face.description && face.description.includes('blurry')) qualityScore -= 0.2;
    
    return Math.max(0, Math.min(1, qualityScore));
  }

  /**
   * Generate face embedding using AI description
   */
  async generateFaceEmbedding(faceCropPath, faceDescription) {
    try {
      // Create a simple embedding based on description
      const features = this.extractFeaturesFromDescription(faceDescription);
      
      // Create a simple numerical representation
      const embedding = this.createEmbeddingVector(features);
      
      return {
        embedding: embedding,
        features: features,
        method: 'description_based'
      };
    } catch (error) {
      console.error('Error generating face embedding:', error);
      throw error;
    }
  }

  /**
   * Extract features from AI description
   */
  extractFeaturesFromDescription(description) {
    const features = {
      age_group: 'unknown',
      gender: 'unknown',
      has_glasses: false,
      has_beard: false,
      has_mustache: false,
      hair_color: 'unknown',
      skin_tone: 'unknown'
    };

    if (!description) return features;

    const desc = description.toLowerCase();

    // Age detection
    if (desc.includes('child') || desc.includes('kid')) features.age_group = 'child';
    else if (desc.includes('teen') || desc.includes('young')) features.age_group = 'young';
    else if (desc.includes('adult') || desc.includes('middle')) features.age_group = 'adult';
    else if (desc.includes('elderly') || desc.includes('senior')) features.age_group = 'elderly';

    // Gender detection
    if (desc.includes('male') && !desc.includes('female')) features.gender = 'male';
    else if (desc.includes('female')) features.gender = 'female';

    // Accessories
    features.has_glasses = desc.includes('glasses') || desc.includes('spectacles');
    features.has_beard = desc.includes('beard');
    features.has_mustache = desc.includes('mustache') || desc.includes('moustache');

    // Hair color
    if (desc.includes('blonde') || desc.includes('blond')) features.hair_color = 'blonde';
    else if (desc.includes('brown')) features.hair_color = 'brown';
    else if (desc.includes('black')) features.hair_color = 'black';
    else if (desc.includes('red') || desc.includes('ginger')) features.hair_color = 'red';
    else if (desc.includes('gray') || desc.includes('grey')) features.hair_color = 'gray';

    return features;
  }

  /**
   * Create embedding vector from features
   */
  createEmbeddingVector(features) {
    // Create a simple 32-dimensional vector based on features
    const vector = new Array(32).fill(0);

    // Age group encoding (positions 0-3)
    const ageGroups = ['child', 'young', 'adult', 'elderly'];
    const ageIndex = ageGroups.indexOf(features.age_group);
    if (ageIndex >= 0) vector[ageIndex] = 1;

    // Gender encoding (positions 4-5)
    if (features.gender === 'male') vector[4] = 1;
    else if (features.gender === 'female') vector[5] = 1;

    // Accessories (positions 6-8)
    if (features.has_glasses) vector[6] = 1;
    if (features.has_beard) vector[7] = 1;
    if (features.has_mustache) vector[8] = 1;

    // Hair color (positions 9-13)
    const hairColors = ['blonde', 'brown', 'black', 'red', 'gray'];
    const hairIndex = hairColors.indexOf(features.hair_color);
    if (hairIndex >= 0) vector[9 + hairIndex] = 1;

    // Add some randomness for uniqueness (positions 14-31)
    for (let i = 14; i < 32; i++) {
      vector[i] = Math.random() * 0.1; // Small random values
    }

    return vector;
  }

  /**
   * Calculate similarity between two face embeddings
   */
  calculateEmbeddingSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Clean up old face crops and thumbnails
   */
  async cleanupOldFiles(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const directories = [this.facesDir, this.thumbnailsDir];

      for (const dir of directories) {
        try {
          const files = await fs.readdir(dir);
          
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);
            
            if (stats.mtime < cutoffDate) {
              await fs.unlink(filePath);
              console.log(`Cleaned up old file: ${file}`);
            }
          }
        } catch (error) {
          // Directory might not exist, that's okay
          console.debug(`Directory ${dir} not accessible:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }
}

// Create singleton instance
const faceCroppingServiceLite = new FaceCroppingServiceLite();

module.exports = faceCroppingServiceLite;
