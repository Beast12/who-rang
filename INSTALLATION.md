
# Installation Guide

Complete setup instructions for the Smart Doorbell Dashboard.

## Prerequisites

### System Requirements
- **Node.js 18+** (for development)
- **Docker** (recommended for deployment)
- **Home Assistant** instance with webhook capability
- **SQLite** database support

### Port Requirements
- **8080**: Frontend (nginx)
- **3001**: Backend API
- **WebSocket**: Same port as backend (3001)

---

## Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd smart-doorbell-dashboard
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev  # Runs on port 8080
```

### 3. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start development server
npm run dev  # Runs on port 3001
```

### 4. Access Application
- Frontend: [http://localhost:8080](http://localhost:8080)
- Backend API: [http://localhost:3001/api](http://localhost:3001/api)
- API Documentation: [http://localhost:8080/api-docs](http://localhost:8080/api-docs)

---

## Docker Deployment

### Production Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development with Docker
```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up -d

# View development logs
docker-compose -f docker-compose.dev.yml logs -f
```

---

## Environment Configuration

### Frontend Environment Variables
```bash
# .env (optional)
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_USE_MOCK_DATA=false
```

### Backend Environment Variables
```bash
# backend/.env (optional)
PORT=3001
DATABASE_PATH=/app/data/doorbell.db
CORS_ORIGIN=http://localhost:8080
NODE_ENV=development
WEBHOOK_TOKEN=your-secure-token-here
WEBHOOK_PATH=/api/webhook/doorbell
```

---

## Database Setup

The application uses SQLite and automatically creates the database on first run.

### Database Location
- Development: `backend/doorbell.db`
- Docker: `/app/data/doorbell.db` (persisted in volume)

### Database Schema
The database will be automatically initialized with the required tables:
- `doorbell_events` - Main events table
- Supports weather data, AI analysis, and device information

---

## Verification

### Health Checks
```bash
# Backend health
curl http://localhost:3001/api/health

# Expected response
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Test Webhook
```bash
curl -X POST http://localhost:3001/api/webhook/doorbell \
  -H "Content-Type: application/json" \
  -d '{
    "ai_message": "Test visitor detected",
    "ai_title": "Test Alert",
    "location": "Front Door"
  }'
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :8080
sudo lsof -i :3001

# Kill process if needed
sudo kill -9 <PID>
```

#### npm ci Error (Missing package-lock.json)
```bash
# Generate package-lock.json
cd backend
npm install

# Or modify Dockerfile to use npm install
```

#### CORS Errors
- Verify `CORS_ORIGIN` matches your frontend URL
- Check both services are running
- Ensure no firewall blocking requests

#### Database Permissions
```bash
# Check database directory permissions
ls -la backend/
chmod 755 backend/
```

### Getting Help

For more troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## Next Steps

1. **Configure Home Assistant** - See [CONFIGURATION.md](CONFIGURATION.md)
2. **Review API Documentation** - Visit `/api-docs` or see [API.md](API.md)
3. **Production Deployment** - See [PRODUCTION.md](PRODUCTION.md)
