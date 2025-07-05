# 🌐 Nginx Proxy Integration Setup

This document explains the integrated nginx proxy setup for the Smart Doorbell Dashboard, providing enhanced security, performance, and deployment flexibility.

## 🏗️ Architecture Overview

```
Internet → Nginx Proxy Manager (SSL) → Container Nginx → Application
```

### **Benefits:**
- ✅ **Enhanced Security** - Applications never directly exposed
- ✅ **Better Performance** - Built-in caching, compression, static file serving
- ✅ **Flexible Configuration** - Custom nginx configs per service
- ✅ **SSL Termination** - Clean SSL handling at Nginx Proxy Manager
- ✅ **Rate Limiting** - Built into each container
- ✅ **Health Monitoring** - Comprehensive health checks

## 📁 File Structure

```
├── Dockerfile                    # Frontend with nginx
├── nginx.conf                    # Frontend nginx config
├── docker-entrypoint.sh          # Frontend startup script
├── inject-config.sh              # Runtime config injection
├── backend/
│   ├── Dockerfile                # Backend with nginx
│   ├── nginx.conf                # Backend nginx main config
│   ├── backend.conf              # Backend server config
│   └── docker-entrypoint.sh      # Backend startup script
└── docker-compose.yml            # Updated service definitions
```

## 🔧 Container Configuration

### **Frontend Container**
- **Base Image:** `nginx:alpine`
- **Port:** 80 (nginx serves static files)
- **Features:**
  - SPA routing support
  - Static asset caching
  - Runtime configuration injection
  - Security headers
  - Health check endpoint

### **Backend Container**
- **Base Image:** `node:22-alpine` + nginx
- **Port:** 80 (nginx proxies to Node.js on 3001)
- **Features:**
  - API rate limiting
  - WebSocket support
  - File upload handling
  - Static file serving for uploads
  - Comprehensive security headers

## 🚀 Deployment Instructions

### **1. Build and Deploy**

```bash
# Build images
docker build -t registry.tuxito.be/doorbell-frontend:latest .
docker build -t registry.tuxito.be/doorbell-backend:latest ./backend

# Push to registry
docker push registry.tuxito.be/doorbell-frontend:latest
docker push registry.tuxito.be/doorbell-backend:latest

# Deploy with Docker Swarm
docker stack deploy -c docker-compose.yml doorbell
```

### **2. Nginx Proxy Manager Configuration**

#### **Frontend Proxy Host**
- **Domain Names:** `doorbell.tuxito.be`
- **Scheme:** `http`
- **Forward Hostname/IP:** `192.168.86.146`
- **Forward Port:** `80` (container nginx port)
- **SSL Certificate:** Let's Encrypt
- **WebSocket Support:** ❌ Not needed
- **Block Common Exploits:** ✅ Enabled

**Custom Nginx Configuration (Optional):**
```nginx
# Additional security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:;" always;
```

#### **Backend API Proxy Host**
- **Domain Names:** `api-doorbell.tuxito.be`
- **Scheme:** `http`
- **Forward Hostname/IP:** `192.168.86.146`
- **Forward Port:** `80` (container nginx port)
- **SSL Certificate:** Let's Encrypt
- **WebSocket Support:** ✅ **REQUIRED** (for real-time features)
- **Block Common Exploits:** ✅ Enabled

**Custom Nginx Configuration (Optional):**
```nginx
# Additional API security
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Optional: Restrict webhook access to specific IPs
location /api/webhook/ {
    # Uncomment and adjust for your Home Assistant IP
    # allow YOUR_HOME_ASSISTANT_IP;
    # deny all;
    
    proxy_pass $forward_scheme://$server:$port;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 🔒 Security Features

### **Frontend Security**
- SPA routing protection
- Static asset caching with immutable headers
- Security headers (XSS, CSRF, etc.)
- Hidden file access denial
- Backup file access denial

### **Backend Security**
- API rate limiting (30 req/s)
- Webhook rate limiting (10 req/s)
- File upload rate limiting (5 req/s)
- File type restrictions for uploads
- Sensitive path access denial
- WebSocket connection limits

### **Rate Limiting Configuration**
```nginx
# API endpoints: 30 requests/second, burst 50
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

# Webhook endpoints: 10 requests/second, burst 10
limit_req_zone $binary_remote_addr zone=webhook:10m rate=10r/s;

# Upload endpoints: 5 requests/second, burst 5
limit_req_zone $binary_remote_addr zone=upload:10m rate=5r/s;
```

## 📊 Monitoring & Health Checks

### **Health Check Endpoints**
- **Frontend:** `http://localhost/health`
- **Backend:** `http://localhost/health`
- **Nginx Status:** `http://localhost/nginx-status` (internal networks only)

### **Docker Health Checks**
Both containers include comprehensive health checks:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3-5
  start_period: 30s
```

## 🔧 Configuration Details

### **Environment Variables**
```yaml
# Frontend
- VITE_API_URL=https://api-doorbell.tuxito.be/api
- VITE_WS_URL=wss://api-doorbell.tuxito.be

# Backend
- PORT=3001                                    # Node.js port (internal)
- CORS_ORIGIN=https://doorbell.tuxito.be      # Frontend domain
- PUBLIC_URL=https://api-doorbell.tuxito.be   # API domain for webhooks
```

### **Volume Mounts**
```yaml
volumes:
  - doorbell-data:/app/data          # Database storage
  - doorbell-uploads:/app/uploads    # File uploads
```

## 🚨 Troubleshooting

### **Common Issues**

1. **WebSocket Connection Failed**
   - Ensure WebSocket support is enabled in Nginx Proxy Manager
   - Check that `wss://` protocol is used for HTTPS sites

2. **File Upload Errors**
   - Verify `client_max_body_size 10M` in nginx config
   - Check volume permissions for uploads directory

3. **Rate Limiting Issues**
   - Adjust rate limits in `backend/nginx.conf`
   - Monitor nginx error logs for rate limit hits

4. **Health Check Failures**
   - Verify both nginx and Node.js are running
   - Check container logs for startup errors

### **Debugging Commands**
```bash
# Check container logs
docker service logs doorbell_doorbell-frontend
docker service logs doorbell_doorbell-backend

# Check nginx configuration
docker exec -it <container_id> nginx -t

# Check nginx status
curl http://localhost/nginx-status

# Test health endpoints
curl http://localhost/health
```

## 🔄 Updates and Maintenance

### **Updating Nginx Configuration**
1. Modify the nginx config files
2. Rebuild the Docker images
3. Push to registry
4. Update the Docker service

### **Monitoring Performance**
- Monitor nginx access logs for performance metrics
- Use `/nginx-status` endpoint for real-time statistics
- Check Docker service health status

## 📈 Performance Optimizations

### **Caching Strategy**
- **Static Assets:** 1 year cache with immutable headers
- **API Responses:** No caching (dynamic content)
- **Upload Files:** 7 days cache for images

### **Compression**
- Gzip enabled for text-based content
- Compression level 6 for optimal balance
- Minimum file size 1024 bytes

### **Connection Optimization**
- HTTP/2 support via Nginx Proxy Manager
- Keep-alive connections to backend
- Connection pooling for database

This setup provides a production-ready, secure, and performant deployment architecture for your Smart Doorbell Dashboard.
