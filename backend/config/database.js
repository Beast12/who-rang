const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const DATABASE_PATH = process.env.DATABASE_PATH || './doorbell.db';

let db;

function initializeDatabase() {
  try {
    db = new Database(DATABASE_PATH);
    console.log('Connected to SQLite database');
    createTables();
    initializeWebhookConfig();
    return db;
  } catch (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
}

function createTables() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS doorbell_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitor_id TEXT UNIQUE NOT NULL,
        timestamp TEXT NOT NULL,
        ai_message TEXT NOT NULL,
        ai_title TEXT,
        image_url TEXT NOT NULL,
        location TEXT NOT NULL,
        weather TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        confidence_score REAL,
        objects_detected TEXT,
        processing_time TEXT,
        model_version TEXT,
        device_name TEXT,
        device_firmware TEXT,
        device_battery INTEGER,
        weather_temperature REAL,
        weather_condition TEXT,
        weather_humidity INTEGER,
        weather_data TEXT
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS webhook_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        webhook_token TEXT,
        webhook_url TEXT,
        webhook_path TEXT DEFAULT '/api/webhook/doorbell',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS persons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS face_encodings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id INTEGER NOT NULL,
        encoding_data TEXT NOT NULL,
        confidence REAL,
        image_path TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS person_visitor_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id INTEGER,
        visitor_event_id INTEGER NOT NULL,
        confidence REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE SET NULL,
        FOREIGN KEY (visitor_event_id) REFERENCES doorbell_events (id) ON DELETE CASCADE
      )
    `);

    // Create face_recognition_config table with all required columns
    console.log('Creating/updating face_recognition_config table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS face_recognition_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enabled BOOLEAN DEFAULT 0,
        ai_provider TEXT DEFAULT 'local',
        api_key TEXT,
        confidence_threshold REAL DEFAULT 0.6,
        training_images_per_person INTEGER DEFAULT 3,
        auto_delete_after_days INTEGER DEFAULT 0,
        background_processing BOOLEAN DEFAULT 1,
        ollama_url TEXT DEFAULT 'http://localhost:11434',
        ollama_model TEXT DEFAULT 'llava',
        openai_model TEXT DEFAULT 'gpt-4o',
        claude_model TEXT DEFAULT 'claude-3-sonnet-20240229',
        cost_tracking_enabled BOOLEAN DEFAULT 1,
        monthly_budget_limit REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add missing columns to existing tables if they don't exist
    const addColumnIfNotExists = (table, column, definition) => {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`Added column ${column} to ${table}`);
      } catch (err) {
        // Column already exists or other error - this is fine
        if (!err.message.includes('duplicate column name')) {
          console.log(`Column ${column} already exists in ${table} or other error:`, err.message);
        }
      }
    };

    // Ensure all face_recognition_config columns exist
    addColumnIfNotExists('face_recognition_config', 'training_images_per_person', 'INTEGER DEFAULT 3');
    addColumnIfNotExists('face_recognition_config', 'auto_delete_after_days', 'INTEGER DEFAULT 0');
    addColumnIfNotExists('face_recognition_config', 'background_processing', 'BOOLEAN DEFAULT 1');
    addColumnIfNotExists('face_recognition_config', 'ollama_url', 'TEXT DEFAULT \'http://localhost:11434\'');
    addColumnIfNotExists('face_recognition_config', 'ollama_model', 'TEXT DEFAULT \'llava\'');
    addColumnIfNotExists('face_recognition_config', 'openai_model', 'TEXT DEFAULT \'gpt-4o\'');
    addColumnIfNotExists('face_recognition_config', 'claude_model', 'TEXT DEFAULT \'claude-3-sonnet-20240229\'');
    addColumnIfNotExists('face_recognition_config', 'current_ai_model', 'TEXT');
    addColumnIfNotExists('face_recognition_config', 'cost_tracking_enabled', 'BOOLEAN DEFAULT 1');
    addColumnIfNotExists('face_recognition_config', 'monthly_budget_limit', 'REAL DEFAULT 0');

    // Add webhook_path column if it doesn't exist
    addColumnIfNotExists('webhook_config', 'webhook_path', 'TEXT DEFAULT \'/api/webhook/doorbell\'');

    // Add new columns to doorbell_events if they don't exist
    const newColumns = [
      'confidence_score REAL',
      'objects_detected TEXT',
      'processing_time TEXT',
      'model_version TEXT',
      'device_name TEXT',
      'device_firmware TEXT',
      'device_battery INTEGER',
      'weather_temperature REAL',
      'weather_condition TEXT',
      'weather_humidity INTEGER',
      'weather_data TEXT',
      'weather_wind_speed REAL',
      'weather_pressure REAL',
      'faces_detected INTEGER DEFAULT 0',
      'faces_processed BOOLEAN DEFAULT 0',
      'ai_confidence_score REAL',
      'ai_objects_detected TEXT',
      'ai_scene_analysis TEXT',
      'ai_processing_complete BOOLEAN DEFAULT 0'
    ];

    newColumns.forEach(column => {
      const [columnName, ...definition] = column.split(' ');
      addColumnIfNotExists('doorbell_events', columnName, definition.join(' '));
    });

    // Add enhanced face detection columns to persons table
    const personColumns = [
      'face_count INTEGER DEFAULT 0',
      'last_seen TEXT',
      'first_seen TEXT',
      'avg_confidence REAL'
    ];

    personColumns.forEach(column => {
      const [columnName, ...definition] = column.split(' ');
      addColumnIfNotExists('persons', columnName, definition.join(' '));
    });

    // Create new table for individual face detections
    db.exec(`
      CREATE TABLE IF NOT EXISTS detected_faces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitor_event_id INTEGER NOT NULL,
        face_crop_path TEXT NOT NULL,
        thumbnail_path TEXT,
        bounding_box TEXT,
        confidence REAL,
        quality_score REAL,
        embedding_data TEXT,
        person_id INTEGER,
        assigned_manually BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        assigned_at TEXT,
        FOREIGN KEY (visitor_event_id) REFERENCES doorbell_events (id) ON DELETE CASCADE,
        FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE SET NULL
      )
    `);

    // Create face merge history table
    db.exec(`
      CREATE TABLE IF NOT EXISTS face_merge_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_face_id INTEGER,
        target_person_id INTEGER,
        merged_by TEXT,
        confidence REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_face_id) REFERENCES detected_faces (id) ON DELETE CASCADE,
        FOREIGN KEY (target_person_id) REFERENCES persons (id) ON DELETE CASCADE
      )
    `);

    // Create AI usage tracking table for cost monitoring
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_usage_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        operation_type TEXT NOT NULL,
        visitor_event_id INTEGER,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        cost_usd REAL DEFAULT 0,
        processing_time_ms INTEGER,
        success BOOLEAN DEFAULT 1,
        error_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (visitor_event_id) REFERENCES doorbell_events (id) ON DELETE SET NULL
      )
    `);

    // Create indexes for better performance
    db.exec(`CREATE INDEX IF NOT EXISTS idx_detected_faces_person_id ON detected_faces (person_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_detected_faces_visitor_event_id ON detected_faces (visitor_event_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_detected_faces_created_at ON detected_faces (created_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_face_merge_history_target_person_id ON face_merge_history (target_person_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_provider ON ai_usage_tracking (provider)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_created_at ON ai_usage_tracking (created_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_visitor_event_id ON ai_usage_tracking (visitor_event_id)`);

    console.log('Enhanced face detection and AI usage tracking tables created');

    // Verify face_recognition_config table structure
    const schemaStmt = db.prepare("PRAGMA table_info(face_recognition_config)");
    const columns = schemaStmt.all();
    console.log('face_recognition_config table schema:', columns.map(col => `${col.name} ${col.type}`));

    console.log('Database tables ready');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
}

function initializeWebhookConfig() {
  const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || null;
  const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/api/webhook/doorbell';
  const PUBLIC_URL = process.env.PUBLIC_URL || process.env.CORS_ORIGIN || 'http://localhost:8080';

  try {
    const configStmt = db.prepare('SELECT * FROM webhook_config LIMIT 1');
    const config = configStmt.get();
    
    if (!config && WEBHOOK_TOKEN) {
      const insertStmt = db.prepare(`
        INSERT INTO webhook_config (webhook_token, webhook_url, webhook_path)
        VALUES (?, ?, ?)
      `);
      insertStmt.run(WEBHOOK_TOKEN, `${PUBLIC_URL}${WEBHOOK_PATH}`, WEBHOOK_PATH);
      console.log('Initialized webhook configuration from environment');
    }

    // Initialize face recognition config if not exists
    const faceConfigStmt = db.prepare('SELECT * FROM face_recognition_config LIMIT 1');
    const faceConfig = faceConfigStmt.get();
    
    console.log('Checking face recognition config initialization...');
    console.log('Existing face config:', faceConfig);
    
    if (!faceConfig) {
      console.log('Initializing face recognition configuration...');
      const insertFaceConfigStmt = db.prepare(`
        INSERT INTO face_recognition_config 
        (enabled, ai_provider, confidence_threshold, training_images_per_person, auto_delete_after_days, background_processing, ollama_url, ollama_model)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = insertFaceConfigStmt.run(0, 'local', 0.6, 3, 0, 1, 'http://localhost:11434', 'llava');
      console.log('Face recognition config initialized with result:', result);
      
      // Verify initialization
      const verifyStmt = db.prepare('SELECT * FROM face_recognition_config WHERE id = ?');
      const newConfig = verifyStmt.get(result.lastInsertRowid);
      console.log('Verified new face config:', newConfig);
    }
  } catch (err) {
    console.error('Error initializing configurations:', err);
  }
}

function getDatabase() {
  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    console.log('Database connection closed');
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
};
