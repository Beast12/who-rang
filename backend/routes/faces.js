
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const PersonController = require('../controllers/personController');
const FaceConfigController = require('../controllers/faceConfigController');
const FaceDetectionController = require('../controllers/faceDetectionController');
const VisitorLabelingController = require('../controllers/visitorLabelingController');
const OllamaController = require('../controllers/ollamaController');

// Person management routes
router.get('/persons', PersonController.getPersons);
router.get('/persons/:id', PersonController.getPerson);
router.post('/persons', PersonController.createPerson);
router.put('/persons/:id', PersonController.updatePerson);
router.delete('/persons/:id', PersonController.deletePerson);

// Face recognition configuration routes
router.get('/config', FaceConfigController.getConfig);
router.put('/config', FaceConfigController.updateConfig);
router.get('/config/debug', FaceConfigController.getDebugInfo);

// Ollama routes
router.get('/ollama/models', OllamaController.getAvailableModels);
router.post('/ollama/test', OllamaController.testConnection);

// Visitor labeling routes
router.post('/label', VisitorLabelingController.labelVisitorEvent);
router.get('/events', VisitorLabelingController.getEventsWithPersons);

// Face detection and training routes
router.post('/detect', upload.single('image'), FaceDetectionController.detectFaces);
router.post('/train/:personId', upload.array('images', 10), FaceDetectionController.trainPerson);
router.get('/processing-status', FaceDetectionController.getProcessingStatus);

module.exports = router;
