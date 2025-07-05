#!/bin/sh

echo "🚀 Starting Smart Doorbell Backend with Nginx..."
date +"[%T] Bootstrap start"

# Ensure directories exist and have correct ownership
echo "📁 Setting up directories..."
date +"[%T] Creating app and nginx directories"
mkdir -p /app/uploads/faces /app/uploads/temp /app/data
mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp
mkdir -p /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp
mkdir -p /var/log/nginx /var/lib/nginx/tmp

# Set ownership for app directories
date +"[%T] Changing ownership of /app"
chown -R node:node /app/uploads /app/data

# Set ownership for nginx directories
date +"[%T] Changing ownership of nginx directories"
chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/lib/nginx

# Set permissions
date +"[%T] Setting permissions"
chmod -R 755 /app/uploads /app/data

# Test nginx configuration
echo "🔍 Testing nginx configuration..."
date +"[%T] Running nginx -t"
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# Start nginx in the background
echo "🌐 Starting nginx..."
date +"[%T] Starting nginx"
nginx

# Wait a moment for nginx to start
sleep 2

# Check if nginx started successfully
if ! pgrep nginx > /dev/null; then
    echo "❌ Failed to start nginx"
    exit 1
fi

echo "✅ Nginx started successfully"
echo "📊 Backend API will be available on port 80"
echo "🔗 Health check available at /health"
date +"[%T] Nginx ready"

# Switch to node user and start the Node.js application
echo "🚀 Starting Node.js application as user 'node'..."
date +"[%T] Starting Node app"
exec su-exec node npm start
