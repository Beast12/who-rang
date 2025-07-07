const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { validateWebhookToken } = require('../middleware/auth');
const { broadcast } = require('../websocket/handler');
const faceProcessingService = require('../services/faceProcessing');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Parse weather data from JSON string
function parseWeatherData(weatherString) {
  if (!weatherString) return null;
  
  try {
    const weatherData = JSON.parse(weatherString);
    return {
      temperature: weatherData.temperature || null,
      condition: weatherData.condition || null,
      humidity: weatherData.humidity || null,
      rawData: weatherString
    };
  } catch (error) {
    console.error('Error parsing weather JSON:', error);
    // Fallback: treat as simple text weather
    return {
      temperature: null,
      condition: weatherString,
      humidity: null,
      rawData: null
    };
  }
}

// Webhook handler function
async function handleWebhookEvent(req, res) {
  const { 
    ai_message, 
    ai_title, 
    location, 
    weather, 
    device_name,
    image_url,
    weather_temperature,
    weather_humidity,
    weather_condition,
    weather_wind_speed,
    weather_pressure
  } = req.body;
  
  if (!ai_message || !location) {
    return res.status(400).json({ error: 'Missing required fields: ai_message, location' });
  }

  // Validate numeric weather fields
  const validatedWeatherTemp = weather_temperature !== undefined ? parseFloat(weather_temperature) : null;
  const validatedWeatherHumidity = weather_humidity !== undefined ? parseInt(weather_humidity) : null;
  const validatedWindSpeed = weather_wind_speed !== undefined ? parseFloat(weather_wind_speed) : null;
  const validatedPressure = weather_pressure !== undefined ? parseFloat(weather_pressure) : null;

  // Parse weather data (fallback for old format)
  const weatherInfo = parseWeatherData(weather);

  // Use direct weather fields if provided, otherwise fall back to parsed weather data
  const finalWeatherTemp = validatedWeatherTemp !== null ? validatedWeatherTemp : weatherInfo?.temperature;
  const finalWeatherCondition = weather_condition || weatherInfo?.condition;
  const finalWeatherHumidity = validatedWeatherHumidity !== null ? validatedWeatherHumidity : weatherInfo?.humidity;

  // Handle image URL - download remote images immediately
  let processedImageUrl;
  if (req.file) {
    processedImageUrl = `/uploads/${req.file.filename}`;
  } else if (image_url && image_url.startsWith('http')) {
    // Download remote image and store locally
    try {
      const faceCroppingService = require('../services/faceCroppingService');
      const localPath = await faceCroppingService.downloadRemoteImage(image_url);
      const filename = path.basename(localPath);
      processedImageUrl = `/uploads/${filename}`;
      console.log(`Downloaded remote image: ${image_url} -> ${processedImageUrl}`);
    } catch (error) {
      console.error('Failed to download remote image:', error);
      processedImageUrl = image_url; // Fallback to original URL
    }
  } else {
    processedImageUrl = image_url || '/placeholder.svg';
  }

  const newEvent = {
    visitor_id: uuidv4(),
    timestamp: new Date().toISOString(),
    ai_message,
    ai_title: ai_title || null,
    image_url: processedImageUrl,
    location,
    weather: finalWeatherCondition || weather || null,
    weather_temperature: finalWeatherTemp,
    weather_condition: finalWeatherCondition,
    weather_humidity: finalWeatherHumidity,
    weather_data: weatherInfo?.rawData || null,
    device_name: device_name || null,
    weather_wind_speed: validatedWindSpeed,
    weather_pressure: validatedPressure
  };

  try {
    const db = require('../config/database').getDatabase();
    
    // Add new columns if they don't exist
    try {
      db.exec(`ALTER TABLE doorbell_events ADD COLUMN weather_wind_speed REAL`);
    } catch (err) {
      // Column already exists, ignore error
    }
    
    try {
      db.exec(`ALTER TABLE doorbell_events ADD COLUMN weather_pressure REAL`);
    } catch (err) {
      // Column already exists, ignore error
    }

    const stmt = db.prepare(`
      INSERT INTO doorbell_events 
      (visitor_id, timestamp, ai_message, ai_title, image_url, location, weather, 
       weather_temperature, weather_condition, weather_humidity, weather_data, 
       device_name, weather_wind_speed, weather_pressure)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      newEvent.visitor_id,
      newEvent.timestamp,
      newEvent.ai_message,
      newEvent.ai_title,
      newEvent.image_url,
      newEvent.location,
      newEvent.weather,
      newEvent.weather_temperature,
      newEvent.weather_condition,
      newEvent.weather_humidity,
      newEvent.weather_data,
      newEvent.device_name,
      newEvent.weather_wind_speed,
      newEvent.weather_pressure
    );

    const eventWithId = { ...newEvent, id: result.lastInsertRowid };
    
    // Add face processing to queue
    const fullImageUrl = req.file 
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : newEvent.image_url;
    
    // Queue face processing (non-blocking)
    faceProcessingService.addToProcessingQueue(eventWithId.id, fullImageUrl)
      .catch(error => console.error('Face processing queue error:', error));
    
    // Broadcast to WebSocket clients
    broadcast({
      type: 'new_visitor',
      data: eventWithId
    });

    res.status(201).json(eventWithId);
  } catch (err) {
    console.error('Error inserting new event:', err);
    res.status(500).json({ error: err.message });
  }
}

// Default webhook endpoint
router.post('/doorbell', validateWebhookToken, upload.single('image'), handleWebhookEvent);

// Custom webhook path handler middleware
function handleCustomWebhookPaths(req, res, next) {
  // Check if this is a webhook request with custom path
  if (req.method === 'POST' && req.path.startsWith('/')) {
    try {
      const db = require('../config/database').getDatabase();
      const stmt = db.prepare('SELECT webhook_path FROM webhook_config LIMIT 1');
      const config = stmt.get();
      
      if (config && config.webhook_path && req.path === config.webhook_path) {
        // Route to webhook handler
        return validateWebhookToken(req, res, () => {
          upload.single('image')(req, res, (err) => {
            if (err) return res.status(500).json({ error: 'Upload failed' });
            handleWebhookEvent(req, res);
          });
        });
      }
    } catch (err) {
      console.error('Error checking custom webhook path:', err);
    }
  }
  next();
}

module.exports = {
  router,
  handleCustomWebhookPaths
};
