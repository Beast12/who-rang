
# Smart Doorbell Dashboard - Deployment Guide

This guide explains how to deploy the Smart Doorbell Dashboard stack using Docker and Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Environment Variables](#environment-variables)
- [Data Persistence](#data-persistence)
- [Networking](#networking)
- [Health Checks](#health-checks)
- [Integration](#integration)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## Prerequisites

### System Requirements
- Docker Engine 20.10+ 
- Docker Compose 2.0+
- At least 2GB RAM
- At least 5GB free disk space

### Installation
```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### Port Requirements
- **8080**: Frontend (nginx)
- **3001**: Backend API
- **WebSocket**: Same port as backend (3001)

## Quick Start

### Production Deployment
```bash
# Clone or download the project
git clone <your-repo-url>
cd smart-doorbell-dashboard

# Build and start services
docker compose up -d

# View logs
docker compose logs -f

# Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:3001/api
```

### Stop Services
```bash
docker compose down
```

## Development Environment

For development with hot reload and source code mounting:

```bash
# Use development configuration
docker compose -f docker-compose.dev.yml up -d

# View development logs
docker compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker compose -f docker-compose.dev.yml down
```

### Development Features
- **Hot Reload**: Frontend and backend code changes are reflected immediately
- **Source Mounting**: Local code changes sync with containers
- **Development Mode**: Backend runs with `npm run dev` using nodemon

## Production Environment

### Initial Setup
```bash
# Build images (optional, done automatically with up)
docker compose build

# Start production stack
docker compose up -d

# Check service status
docker compose ps
```

### Production Features
- **Optimized Builds**: Multi-stage Docker builds for smaller images
- **Health Checks**: Built-in health monitoring
- **Data Persistence**: Volumes for database and uploads
- **Production Nginx**: Optimized static file serving

## Environment Variables

### Frontend Variables
```bash
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

### Backend Variables
```bash
PORT=3001
DATABASE_PATH=/app/data/doorbell.db
CORS_ORIGIN=http://localhost:8080
NODE_ENV=production  # or development
```

### Custom Configuration
Create a `.env` file in the project root:
```bash
# Custom API URL for external access
VITE_API_URL=http://your-domain.com:3001/api
VITE_WS_URL=ws://your-domain.com:3001

# Custom backend settings
CORS_ORIGIN=http://your-domain.com:8080
```

Then run with:
```bash
docker compose --env-file .env up -d
```

## Data Persistence

### Volumes
- **doorbell-data**: SQLite database storage
- **doorbell-uploads**: User uploaded images

### Backup Database
```bash
# Create backup
docker compose exec backend sqlite3 /app/data/doorbell.db ".backup '/app/data/backup.db'"

# Copy backup to host
docker cp $(docker compose ps -q backend):/app/data/backup.db ./backup.db
```

### Restore Database
```bash
# Copy backup to container
docker cp ./backup.db $(docker compose ps -q backend):/app/data/restore.db

# Restore database
docker compose exec backend sqlite3 /app/data/doorbell.db ".restore '/app/data/restore.db'"
```

## Networking

### Internal Network
Services communicate via the `doorbell-network` bridge network:
- Frontend → Backend: `http://backend:3001`
- External → Frontend: `http://localhost:8080`
- External → Backend: `http://localhost:3001`

### CORS Configuration
The backend is configured to accept requests from the frontend origin. Modify `CORS_ORIGIN` for different setups.

## Health Checks

### Backend Health Check
```bash
# Check backend health
curl http://localhost:3001/api/health

# Expected response
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Container Health Status
```bash
# View container health
docker compose ps

# Detailed health check logs
docker inspect $(docker compose ps -q backend) | grep -A 10 "Health"
```

## Integration

### Home Assistant Integration

Add to your Home Assistant configuration:

```yaml
# configuration.yaml
automation:
  - alias: "Doorbell Visitor Detected"
    trigger:
      platform: state
      entity_id: binary_sensor.doorbell_motion
      to: 'on'
    action:
      service: rest_command.doorbell_webhook
      data:
        ai_message: "Motion detected at front door"
        ai_title: "Motion Alert"
        location: "Front Door"
        weather: "{{ states('weather.home') }}"

rest_command:
  doorbell_webhook:
    url: "http://your-host:3001/api/webhook/doorbell"
    method: POST
    headers:
      Content-Type: "application/json"
    payload: >
      {
        "ai_message": "{{ ai_message }}",
        "ai_title": "{{ ai_title }}",
        "location": "{{ location }}",
        "weather": "{{ weather }}"
      }
```

### API Endpoints

#### POST /api/webhook/doorbell
Send new doorbell events:
```bash
curl -X POST http://localhost:3001/api/webhook/doorbell \
  -H "Content-Type: application/json" \
  -d '{
    "ai_message": "Package delivery detected",
    "ai_title": "Delivery",
    "location": "Front Door",
    "weather": "sunny"
  }'
```

#### GET /api/visitors
Retrieve visitor data:
```bash
curl "http://localhost:3001/api/visitors?page=1&limit=10&search=delivery"
```

## Troubleshooting

### Build Issues

#### npm ci Error (Missing package-lock.json)
If you encounter the npm ci error during build:

```bash
# Option 1: Generate package-lock.json
cd backend
npm install
cd ..
docker compose build

# Option 2: Use npm install instead of npm ci
# Edit backend/Dockerfile and change:
# RUN npm ci --only=production
# to:
# RUN npm install --omit=dev
```

#### Port Already in Use
```bash
# Find process using port 8080
sudo lsof -i :8080

# Kill process if needed
sudo kill -9 <PID>

# Or use different ports
docker compose up -d --scale frontend=0
docker run -d -p 8081:80 your-frontend-image
```

### Runtime Issues

#### Backend Connection Failed
```bash
# Check backend logs
docker compose logs backend

# Verify backend is running
curl http://localhost:3001/api/health

# Check database permissions
docker compose exec backend ls -la /app/data/
```

#### WebSocket Connection Issues
```bash
# Test WebSocket connection
wscat -c ws://localhost:3001

# Check nginx WebSocket proxy
docker compose logs frontend
```

#### Database Issues
```bash
# Check database file
docker compose exec backend sqlite3 /app/data/doorbell.db ".tables"

# Reset database (WARNING: deletes all data)
docker compose down
docker volume rm doorbell-data
docker compose up -d
```

### Common Solutions

#### Rebuild from Scratch
```bash
# Stop and remove everything
docker compose down -v --remove-orphans

# Remove images
docker rmi $(docker images -q "smart-doorbell*")

# Rebuild and start
docker compose up -d --build
```

#### View All Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

## Maintenance

### Updates
```bash
# Update application code
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build
```

### Monitoring
```bash
# Resource usage
docker stats

# Service status
docker compose ps

# Disk usage
docker system df
```

### Cleanup
```bash
# Remove unused images
docker image prune -f

# Remove unused volumes (careful!)
docker volume prune -f

# Complete cleanup
docker system prune -a -f
```

### Log Rotation
```bash
# Configure log rotation in docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Security Considerations

- Change default ports in production
- Use environment variables for sensitive data
- Implement proper firewall rules
- Regular security updates
- Monitor access logs
- Use HTTPS in production (add reverse proxy)

## Performance Tuning

### Production Optimizations
- Enable gzip compression in nginx
- Implement Redis for caching
- Use external database for high load
- Configure proper Docker resource limits
- Implement log aggregation

For additional help, check the application logs and refer to the Docker documentation.
