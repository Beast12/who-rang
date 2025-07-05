#!/bin/sh

# Runtime configuration injection script for frontend
# This script injects runtime configuration into the built React app

echo "🔧 Injecting runtime configuration..."

# Create runtime config object
cat > /usr/share/nginx/html/runtime-config.js << EOF
window.__RUNTIME_CONFIG__ = {
  VITE_API_URL: '${VITE_API_URL:-/api}',
  VITE_WS_URL: '${VITE_WS_URL:-auto}'
};
console.log('Runtime configuration loaded:', window.__RUNTIME_CONFIG__);
EOF

# Inject the runtime config script into index.html
if [ -f "/usr/share/nginx/html/index.html" ]; then
  # Check if runtime config is already injected
  if ! grep -q "runtime-config.js" /usr/share/nginx/html/index.html; then
    echo "📝 Injecting runtime config script into index.html..."
    
    # Create a temporary file with the script injection
    sed 's|<head>|<head>\n  <script src="/runtime-config.js"></script>|' /usr/share/nginx/html/index.html > /tmp/index.html.tmp
    
    # Replace the original file
    mv /tmp/index.html.tmp /usr/share/nginx/html/index.html
    
    echo "✅ Runtime configuration injected successfully"
  else
    echo "ℹ️  Runtime config script already present in index.html"
  fi
else
  echo "❌ Error: index.html not found!"
  exit 1
fi

# Log the configuration for debugging
echo "🔍 Current runtime configuration:"
echo "  VITE_API_URL: ${VITE_API_URL:-/api}"
echo "  VITE_WS_URL: ${VITE_WS_URL:-auto}"

echo "✅ Configuration injection completed"