
function validateWebhookToken(req, res, next) {
  const token = req.headers['x-webhook-token'] || req.body.webhook_token;
  const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || null;
  
  if (!token) {
    return next(); // Allow requests without token for backward compatibility
  }

  try {
    // Check environment token first
    if (WEBHOOK_TOKEN && token === WEBHOOK_TOKEN) {
      return next();
    }

    // Check database token
    const db = require('../config/database').getDatabase();
    const configStmt = db.prepare('SELECT webhook_token FROM webhook_config WHERE webhook_token = ? LIMIT 1');
    const config = configStmt.get(token);
    
    if (config) {
      return next();
    }

    return res.status(401).json({ error: 'Invalid webhook token' });
  } catch (err) {
    console.error('Error validating webhook token:', err);
    return res.status(500).json({ error: 'Token validation failed' });
  }
}

module.exports = {
  validateWebhookToken
};
