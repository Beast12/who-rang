
# Production Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Domain name with DNS pointing to your server
- SSL certificates (recommended: Let's Encrypt with Traefik or similar)
- Reverse proxy setup (Nginx, Traefik, Cloudflare, etc.)

## Quick Start

### 1. Environment Configuration

Copy the example environment file and configure it for your domain:

```bash
cp .env.example .env
```

Edit `.env` with your production values:

```bash
# Your production domain configuration
PUBLIC_URL=https://yourdomain.com
FRONTEND_DOMAIN=yourdomain.com
BACKEND_DOMAIN=api.yourdomain.com

# API URLs (used by frontend at build time)
VITE_API_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Generate a secure webhook token
WEBHOOK_TOKEN=$(openssl rand -base64 32)

# Enable proxy trust
TRUST_PROXY=true
```

### 2. Deploy with Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Reverse Proxy Configuration

### Traefik (Recommended)

The production Docker Compose includes Traefik labels. Ensure your Traefik configuration includes:

```yaml
# traefik.yml
entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@domain.com
      storage: /etc/traefik/acme.json
      httpChallenge:
        entryPoint: web
```

### Nginx

Example Nginx configuration:

```nginx
# Frontend
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Cloudflare

If using Cloudflare:

1. Set SSL/TLS mode to "Full (strict)"
2. Enable WebSocket support in Network settings
3. Configure your origin server to use HTTPS

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PUBLIC_URL` | Yes | - | Public URL of your frontend |
| `FRONTEND_DOMAIN` | Yes | - | Domain for frontend service |
| `BACKEND_DOMAIN` | Yes | - | Domain for backend API |
| `VITE_API_URL` | Yes | - | Full API URL (build-time) |
| `VITE_WS_URL` | Yes | - | WebSocket URL (build-time) |
| `CORS_ORIGIN` | Yes | - | Allowed CORS origins |
| `WEBHOOK_TOKEN` | Recommended | - | Secure webhook token |
| `WEBHOOK_PATH` | No | `/api/webhook/doorbell` | Custom webhook path |
| `TRUST_PROXY` | No | `true` | Enable proxy trust |
| `FRONTEND_PORT` | No | `8080` | Frontend container port |
| `BACKEND_PORT` | No | `3001` | Backend container port |

## Security Considerations

### Webhook Security

Generate a strong webhook token:

```bash
# Generate secure token
openssl rand -base64 32

# Or use uuidgen
uuidgen
```

### Database Security

- Database is stored in Docker volumes
- Regular backups recommended
- Consider encryption at rest for sensitive data

### Network Security

- Use HTTPS/WSS in production
- Configure firewall to only allow necessary ports
- Use strong SSL/TLS configuration

## Monitoring & Health Checks

### Health Check Endpoints

- Backend: `https://api.yourdomain.com/api/health`
- Frontend: `https://yourdomain.com/` (should return 200)

### Log Monitoring

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Metrics

The application exposes basic health metrics at `/api/health`:

```json
{
  "status": "healthy",
  "timestamp": "2025-06-30T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

## Troubleshooting

### Common Issues

#### WebSocket Connection Fails

1. Check proxy WebSocket configuration
2. Verify WSS protocol for HTTPS sites
3. Check firewall settings

#### CORS Errors

1. Verify `CORS_ORIGIN` matches your frontend domain
2. Check proxy headers are being forwarded
3. Ensure `TRUST_PROXY=true` is set

#### Build Fails

1. Check environment variables are set during build
2. Verify API URLs are accessible during build
3. Check Docker build logs

### Debug Mode

Enable debug logging:

```bash
# Add to .env
NODE_ENV=development

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

## Backup & Recovery

### Database Backup

```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec backend cp /app/data/doorbell.db /app/data/backup-$(date +%Y%m%d).db

# Copy backup to host
docker cp $(docker-compose -f docker-compose.prod.yml ps -q backend):/app/data/backup-$(date +%Y%m%d).db ./
```

### Volume Backup

```bash
# Backup all data
docker run --rm -v doorbell_doorbell-data:/data -v $(pwd):/backup alpine tar czf /backup/doorbell-data-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v doorbell_doorbell-uploads:/data -v $(pwd):/backup alpine tar czf /backup/doorbell-uploads-$(date +%Y%m%d).tar.gz -C /data .
```

## Updates

### Application Updates

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Restart with new images
docker-compose -f docker-compose.prod.yml up -d
```

### Database Migrations

The application handles database migrations automatically on startup. No manual intervention required.
