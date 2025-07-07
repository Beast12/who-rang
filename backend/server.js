
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

// Import modules
const { initializeDatabase, closeDatabase } = require('./config/database');
const { initializeWebSocket } = require('./websocket/handler');
const apiRoutes = require('./routes/api');
const { router: webhookRoutes, handleCustomWebhookPaths } = require('./routes/webhook');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8080';
const CORS_MODE = process.env.CORS_MODE || 'auto';
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/api/webhook/doorbell';
const TRUST_PROXY = process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production';

// Configure proxy trust for production deployments
if (TRUST_PROXY) {
  app.set('trust proxy', true);
  console.log('Proxy trust enabled for production deployment');
}

// Initialize database
const db = initializeDatabase();

// Initialize WebSocket
const wss = initializeWebSocket(server);

// Enhanced CORS configuration with multiple modes
const corsOrigins = CORS_ORIGIN.split(',').map(origin => origin.trim());

// Determine CORS mode
let effectiveCorsMode = CORS_MODE;
if (CORS_MODE === 'auto') {
  if (CORS_ORIGIN === 'http://localhost:8080') {
    effectiveCorsMode = 'permissive';
  } else {
    effectiveCorsMode = 'strict';
  }
}

// CORS configuration strategies
const corsConfigs = {
  strict: {
    origin: function(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (corsOrigins.includes(origin)) {
        console.log(`✅ CORS allowed: ${origin}`);
        return callback(null, true);
      }
      
      // For development, allow localhost variants
      if (process.env.NODE_ENV === 'development' && 
          (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        console.log(`✅ CORS allowed (dev): ${origin}`);
        return callback(null, true);
      }
      
      // For production, allow tuxito.be subdomains if not explicitly configured
      if (origin && origin.includes('tuxito.be')) {
        console.log(`✅ CORS allowed (tuxito.be): ${origin}`);
        return callback(null, true);
      }
      
      // Log CORS rejection for debugging
      console.log(`❌ CORS rejected: ${origin}, allowed: ${corsOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  },
  permissive: {
    origin: function(origin, callback) {
      // Allow ALL origins in permissive mode (minimal logging)
      return callback(null, origin || '*');
    },
    credentials: false // Safer with open CORS
  },
  development: {
    origin: function(origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      // Allow configured origins
      if (corsOrigins.includes(origin)) {
        console.log(`✅ CORS allowed: ${origin}`);
        return callback(null, true);
      }
      
      // Allow localhost and development variants
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || 
          origin.includes('192.168.') || origin.includes('10.0.') || 
          origin.includes('172.16.')) {
        console.log(`✅ CORS allowed (dev): ${origin}`);
        return callback(null, true);
      }
      
      // Allow tuxito.be subdomains
      if (origin && origin.includes('tuxito.be')) {
        console.log(`✅ CORS allowed (tuxito.be): ${origin}`);
        return callback(null, true);
      }
      
      console.log(`❌ CORS rejected: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }
};

// Apply CORS configuration
const corsConfig = corsConfigs[effectiveCorsMode] || corsConfigs.strict;
app.use(cors({
  ...corsConfig,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-For', 'X-Forwarded-Proto', 'X-Webhook-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page']
}));

// Enhanced CORS middleware with immediate header setting
app.use((req, res, next) => {
  const origin = req.get('origin');
  
  // Set CORS headers immediately for permissive mode
  if (effectiveCorsMode === 'permissive') {
    const allowOrigin = origin || '*';
    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Forwarded-For, X-Forwarded-Proto, X-Webhook-Token');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
});

// Middleware for handling proxy headers
app.use((req, res, next) => {
  // Log proxy headers in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Request headers:', {
      'x-forwarded-for': req.get('x-forwarded-for'),
      'x-forwarded-proto': req.get('x-forwarded-proto'),
      'x-real-ip': req.get('x-real-ip'),
      origin: req.get('origin'),
      host: req.get('host')
    });
  }
  next();
});

app.use(express.json());

// Custom webhook path handler (must be before API routes)
app.use(handleCustomWebhookPaths);

// API Routes
app.use('/api', apiRoutes);

// Webhook Routes
app.use('/api/webhook', webhookRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check endpoint for load balancers
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Enhanced error handling for production
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ message: 'Internal server error' });
  } else {
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔔 WhoRang - AI-Powered Doorbell Intelligence`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Mode: ${effectiveCorsMode} (configured: ${CORS_MODE})`);
  console.log(`CORS Origins: ${corsOrigins.join(', ')}`);
  console.log(`Proxy Trust: ${TRUST_PROXY ? 'enabled' : 'disabled'}`);
  console.log(`WebSocket server ready`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  closeDatabase();
  process.exit(0);
});
