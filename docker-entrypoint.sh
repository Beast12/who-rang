#!/bin/sh

# Docker entrypoint script for frontend with nginx
echo "🚀 Starting Smart Doorbell Frontend with Nginx..."
date +"[%T] Bootstrap start"

# Inject runtime configuration
echo "🔧 Injecting runtime configuration..."
date +"[%T] Running /inject-config.sh"
/inject-config.sh
date +"[%T] Finished inject-config.sh"

# Ensure nginx directories exist and have proper permissions
echo "📁 Setting up nginx directories..."
date +"[%T] Creating nginx temp dirs"
mkdir -p /var/cache/nginx/client_temp
mkdir -p /var/cache/nginx/proxy_temp
mkdir -p /var/cache/nginx/fastcgi_temp
mkdir -p /var/cache/nginx/uwsgi_temp
mkdir -p /var/cache/nginx/scgi_temp

# Set proper permissions for nginx
date +"[%T] Setting ownership"
chown -R nginx:nginx /var/cache/nginx
chown -R nginx:nginx /var/log/nginx

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

date +"[%T] Starting nginx"
echo "🌐 Starting nginx server..."
echo "📊 Frontend will be available on port 80"
echo "🔗 Health check available at /health"

# Execute the command passed to the container (usually: nginx -g 'daemon off;')
date +"[%T] Exec passed command"
exec "$@"
