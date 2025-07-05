const express = require('express');
const router = express.Router();
const DetectedFacesController = require('../controllers/detectedFacesController');

// Get all unassigned faces (for manual labeling)
router.get('/unassigned', DetectedFacesController.getUnassignedFaces);

// Get faces for a specific person
router.get('/person/:personId', DetectedFacesController.getPersonFaces);

// Assign a face to a person (manual labeling)
router.post('/:faceId/assign', DetectedFacesController.assignFaceToPerson);

// Unassign a face from a person
router.post('/:faceId/unassign', DetectedFacesController.unassignFace);

// Bulk assign multiple faces to a person
router.post('/bulk-assign', DetectedFacesController.bulkAssignFaces);

// Get face similarity suggestions for a specific face
router.get('/:faceId/similarities', DetectedFacesController.getFaceSimilarities);

// Delete a detected face
router.delete('/:faceId', DetectedFacesController.deleteFace);

// Get face detection statistics
router.get('/stats', DetectedFacesController.getFaceStats);

module.exports = router;
