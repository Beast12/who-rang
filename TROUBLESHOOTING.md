
# Troubleshooting Guide

Common issues and solutions for the Smart Doorbell Dashboard.

## Application Issues

### Frontend Not Loading

#### Symptoms
- Blank page or loading spinner
- Console errors in browser
- 404 errors for assets

#### Solutions
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Restart frontend
npm run dev

# Clear browser cache
# Chrome: Ctrl+Shift+R
# Firefox: Ctrl+F5

# Check console logs
# Browser: F12 > Console
```

### Backend Connection Failed

#### Symptoms
- "Failed to fetch" errors
- API requests timing out
- WebSocket connection failing

#### Solutions
```bash
# Check backend logs
docker-compose logs backend

# Verify backend is running
curl http://localhost:3001/api/health

# Check port conflicts
sudo lsof -i :3001

# Restart backend
docker-compose restart backend
```

### Database Issues

#### Database Locked
```bash
# Check if database file is accessible
docker-compose exec backend ls -la /app/data/

# Restart backend to release locks
docker-compose restart backend

# If persistent, backup and recreate
docker-compose exec backend cp /app/data/doorbell.db /app/data/backup.db
docker-compose down -v
docker-compose up -d
```

#### Database Corruption
```bash
# Check database integrity
docker-compose exec backend sqlite3 /app/data/doorbell.db "PRAGMA integrity_check;"

# Repair if needed
docker-compose exec backend sqlite3 /app/data/doorbell.db ".recover /app/data/recovered.db"

# Replace corrupted database
docker-compose exec backend mv /app/data/recovered.db /app/data/doorbell.db
docker-compose restart backend
```

---

## Docker Issues

### Build Failures

#### npm ci Error (Missing package-lock.json)
```bash
# Generate missing lock file
cd backend
npm install
cd ..

# Or update Dockerfile to use npm install
# Change: RUN npm ci --only=production
# To: RUN npm install --omit=dev
```

#### Docker Build Context Too Large
```bash
# Check .dockerignore file
cat .dockerignore

# Add to .dockerignore:
node_modules
*.log
.git
.env*
```

### Runtime Issues

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :8080
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>

# Or use different ports
docker-compose down
# Edit docker-compose.yml ports
docker-compose up -d
```

#### Container Startup Failures
```bash
# Check container logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart backend
```

#### Volume Mount Issues
```bash
# Check volume permissions
docker-compose exec backend ls -la /app/data/

# Fix permissions if needed
docker-compose exec backend chown -R node:node /app/data/

# Recreate volumes
docker-compose down -v
docker-compose up -d
```

---

## Network and Connectivity

### CORS Errors

#### Symptoms
- "CORS policy" errors in browser console
- API calls failing from frontend

#### Solutions
```bash
# Check CORS_ORIGIN environment variable
docker-compose exec backend env | grep CORS

# Update docker-compose.yml
environment:
  - CORS_ORIGIN=http://localhost:8080

# Restart backend
docker-compose restart backend
```

### WebSocket Connection Issues

#### Symptoms
- Real-time updates not working
- WebSocket connection errors in console

#### Solutions
```bash
# Test WebSocket connection
wscat -c ws://localhost:3001

# Check proxy configuration (if using)
# Ensure WebSocket upgrades are allowed

# Verify WebSocket URL in frontend
# Should match backend host and port
```

### Reverse Proxy Issues

#### Nginx Configuration
```nginx
# Add WebSocket support
location / {
    proxy_pass http://backend:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

#### Traefik Configuration
```yaml
labels:
  - "traefik.http.routers.backend.rule=Host(`api.yourdomain.com`)"
  - "traefik.http.services.backend.loadbalancer.server.port=3001"
```

---

## Home Assistant Integration

### Webhook Not Receiving Data

#### Check Home Assistant Logs
```bash
# View Home Assistant logs
docker logs homeassistant

# Or in Home Assistant UI:
# Settings > System > Logs
```

#### Test Webhook Manually
```bash
# Test from Home Assistant host
curl -X POST http://your-dashboard-host:3001/api/webhook/doorbell \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ai_message":"Test","location":"Front Door"}'
```

#### Common Issues
- **DNS Resolution**: Use IP addresses instead of hostnames
- **Firewall**: Ensure port 3001 is accessible
- **SSL/TLS**: Use HTTP for testing, HTTPS for production

### Authentication Errors

#### Invalid Token
```bash
# Check token in Dashboard settings
# Settings > Webhook > Token

# Verify token in Home Assistant configuration
# Should match exactly (case-sensitive)
```

#### Token Not Sent
```yaml
# Ensure authorization header is set
rest_command:
  doorbell_webhook:
    headers:
      authorization: "Bearer YOUR_WEBHOOK_TOKEN"
```

### Weather Data Issues

#### Weather Entity Not Found
```bash
# Check weather entities in Home Assistant
# Developer Tools > States
# Look for entities starting with "weather."
```

#### Weather Attributes Missing
```yaml
# Test weather template
{{ state_attr('weather.home', 'temperature') }}
{{ state_attr('weather.home', 'forecast') }}

# If null, check weather integration configuration
```

---

## Performance Issues

### Slow API Responses

#### Database Performance
```bash
# Check database size
docker-compose exec backend ls -lh /app/data/doorbell.db

# Optimize database
docker-compose exec backend sqlite3 /app/data/doorbell.db "VACUUM;"

# Clear old data if needed
# Settings > Database > Clear Events
```

#### Memory Usage
```bash
# Check container resource usage
docker stats

# Increase memory limits in docker-compose.yml
services:
  backend:
    mem_limit: 512m
```

### Slow Frontend Loading

#### Large Images
- Optimize image sizes before upload
- Use appropriate image formats (WebP, JPEG)
- Implement image compression

#### Bundle Size
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

---

## Security Issues

### SSL/TLS Certificate Issues

#### Self-Signed Certificates
```bash
# For development only - disable SSL verification
curl -k https://your-host/api/health

# Production: Use proper certificates
# Let's Encrypt, CloudFlare, etc.
```

#### Certificate Expiry
```bash
# Check certificate expiry
echo | openssl s_client -connect your-host:443 2>/dev/null | openssl x509 -noout -dates
```

### Authentication Issues

#### Weak Tokens
```bash
# Generate strong token
openssl rand -base64 32

# Update in Dashboard settings and Home Assistant config
```

---

## Monitoring and Debugging

### Enable Debug Logging

#### Backend Debug Mode
```yaml
# docker-compose.yml
environment:
  - NODE_ENV=development
  - DEBUG=*
```

#### Frontend Debug Mode
```bash
# Add to .env
VITE_DEBUG=true
```

### Health Check Endpoints

#### Backend Health
```bash
curl http://localhost:3001/api/health
```

#### Database Health
```bash
curl http://localhost:3001/api/database/stats
```

### Log Analysis

#### View All Logs
```bash
# All services
docker-compose logs -f

# Specific service with timestamps
docker-compose logs -f -t backend
```

#### Log Rotation
```yaml
# docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Recovery Procedures

### Complete Reset

#### Nuclear Option (Destroys All Data)
```bash
# Stop all services
docker-compose down -v --remove-orphans

# Remove all images
docker rmi $(docker images -q smart-doorbell*)

# Remove volumes
docker volume prune -f

# Rebuild from scratch
docker-compose up -d --build
```

### Data Recovery

#### Backup Before Troubleshooting
```bash
# Backup database
docker-compose exec backend cp /app/data/doorbell.db /app/data/backup-$(date +%Y%m%d).db

# Copy to host
docker cp $(docker-compose ps -q backend):/app/data/backup-$(date +%Y%m%d).db ./
```

#### Restore from Backup
```bash
# Copy backup to container
docker cp ./backup.db $(docker-compose ps -q backend):/app/data/restore.db

# Restore database
docker-compose exec backend mv /app/data/restore.db /app/data/doorbell.db
docker-compose restart backend
```

---

## Getting Help

### Useful Commands for Support

```bash
# System information
docker --version
docker-compose --version
uname -a

# Service status
docker-compose ps
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend

# Network connectivity
curl -I http://localhost:3001/api/health
ping your-homeassistant-host

# Resource usage
docker stats --no-stream
df -h
free -h
```

### Log Collection

```bash
# Collect all logs for support
mkdir support-logs
docker-compose logs backend > support-logs/backend.log
docker-compose logs frontend > support-logs/frontend.log
docker-compose ps > support-logs/containers.txt
docker version > support-logs/docker-info.txt
```

---

## Prevention

### Regular Maintenance

#### Weekly Tasks
- Check disk space
- Review application logs
- Verify backup integrity
- Test webhook connectivity

#### Monthly Tasks
- Update Docker images
- Rotate logs
- Clean unused Docker resources
- Review security configurations

### Monitoring Setup

#### Basic Monitoring Script
```bash
#!/bin/bash
# health-check.sh

# Check backend health
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "Backend: OK"
else
    echo "Backend: FAILED"
    docker-compose restart backend
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage at ${DISK_USAGE}%"
fi
```

For additional support, check the API documentation at `/api-docs` or review the configuration guides.
