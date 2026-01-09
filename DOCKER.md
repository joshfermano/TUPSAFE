# Docker Configuration for TUPSAFE

This document provides comprehensive instructions for running TUPSAFE using Docker and Docker Compose.

## Architecture Overview

TUPSAFE uses a microservices architecture with the following components:

- **Employee Portal** (Next.js 15.5.9) - Port 3000
- **Admin Portal** (Next.js 15.5.9) - Port 3001
- **AI Agent Service** (Python FastAPI) - Port 8000
- **Redis** (Cache & Session Store) - Port 6379
- **Supabase PostgreSQL** (External/Cloud-hosted)

## Prerequisites

- Docker Engine 24.0+ or Docker Desktop
- Docker Compose V2
- At least 4GB RAM available for containers
- Ports 3000, 3001, 8000, and 6379 available

## Helper Scripts

Helper scripts are available in the `scripts/` folder:

### Windows (PowerShell)

```powershell
# Start all services
.\scripts\docker-dev.ps1 start

# Stop all services
.\scripts\docker-dev.ps1 stop

# View logs
.\scripts\docker-dev.ps1 logs

# View logs for specific service
.\scripts\docker-dev.ps1 logs ai-agent

# Check health status
.\scripts\docker-dev.ps1 status

# Rebuild all services
.\scripts\docker-dev.ps1 rebuild

# Start production
.\scripts\docker-dev.ps1 prod

# Show all commands
.\scripts\docker-dev.ps1 help
```

### Linux/macOS (Bash)

```bash
# Make script executable (first time only)
chmod +x scripts/docker-dev.sh

# Start all services
./scripts/docker-dev.sh start

# Stop all services
./scripts/docker-dev.sh stop

# View logs
./scripts/docker-dev.sh logs

# Check health status
./scripts/docker-dev.sh status

# Show all commands
./scripts/docker-dev.sh help
```

---

## Quick Start

### Development Environment

1. **Clone the repository and navigate to the project root**

```bash
cd C:\Personal\TUPSAFE
```

2. **Ensure environment files exist**

```bash
# Employee portal
cp apps/employee/.env.example apps/employee/.env.local

# Admin portal
cp apps/admin/.env.example apps/admin/.env.local

# AI Agent
cp services/ai-agent/.env.example services/ai-agent/.env
```

3. **Start all services**

```bash
docker-compose up -d
```

4. **View logs**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f employee
docker-compose logs -f admin
docker-compose logs -f ai-agent
```

5. **Access the applications**

- Employee Portal: http://localhost:3000
- Admin Portal: http://localhost:3001
- AI Agent API: http://localhost:8000
- AI Agent Docs: http://localhost:8000/docs

### Production Environment

1. **Set production environment variables**

Edit your environment files with production values:
- Database connection strings
- API keys and secrets
- Redis password

2. **Set Redis password**

```bash
# Windows
$env:REDIS_PASSWORD="your-secure-redis-password"

# Linux/macOS
export REDIS_PASSWORD="your-secure-redis-password"
```

3. **Build and start production containers**

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

4. **Verify health status**

```bash
# Check all containers
docker-compose -f docker-compose.prod.yml ps

# Check health endpoints
curl http://localhost:3000/api/health
curl http://localhost:3001/api/health
curl http://localhost:8000/health
```

## Building Individual Services

### Employee Portal

```bash
docker build --build-arg APP_NAME=employee -t tupsafe-employee:latest .
docker run -p 3000:3000 --env-file apps/employee/.env.local tupsafe-employee:latest
```

### Admin Portal

```bash
docker build --build-arg APP_NAME=admin -t tupsafe-admin:latest .
docker run -p 3001:3001 --env-file apps/admin/.env.local tupsafe-admin:latest
```

### AI Agent

```bash
cd services/ai-agent
docker build -t tupsafe-ai-agent:latest .
docker run -p 8000:8000 --env-file .env tupsafe-ai-agent:latest
```

## Docker Compose Commands

### Development (docker-compose.yml)

```bash
# Start all services in detached mode
docker-compose up -d

# Start specific service
docker-compose up -d employee

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild and start
docker-compose up -d --build

# View logs (follow mode)
docker-compose logs -f

# View logs for specific service
docker-compose logs -f employee

# Restart a service
docker-compose restart employee

# Execute command in running container
docker-compose exec employee sh
docker-compose exec ai-agent bash
```

### Production (docker-compose.prod.yml)

```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production services
docker-compose -f docker-compose.prod.yml down

# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale employee=2
```

## Environment Variables

### Required for Next.js Apps (Employee & Admin)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# App Configuration
NODE_ENV=production
PORT=3000  # or 3001 for admin
NEXT_PUBLIC_APP_PORTAL=employee  # or admin

# Service URLs (for Docker internal network)
REDIS_URL=redis://redis:6379
AI_AGENT_URL=http://ai-agent:8000

# Admin URLs
NEXT_PUBLIC_EMPLOYEE_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3001
```

### Required for AI Agent Service

```env
# API Keys
OPENAI_API_KEY=your-openai-key
GOOGLE_API_KEY=your-google-key
GROQ_API_KEY=your-groq-key

# Redis
REDIS_URL=redis://redis:6379

# Service Configuration
ENVIRONMENT=production
LOG_LEVEL=INFO
MAX_TOKENS=4096
TEMPERATURE=0.7
```

## Docker Network Communication

Services communicate via the internal Docker network `tupsafe-network`:

- From Next.js apps to Redis: `redis://redis:6379`
- From Next.js apps to AI Agent: `http://ai-agent:8000`
- External access uses localhost or server IP

## Volume Management

### Development Volumes

Development uses bind mounts for hot reloading:

```yaml
volumes:
  - ./apps/employee:/app/apps/employee  # Source code
  - /app/node_modules                    # Anonymous volume for node_modules
```

### Production Volumes

Production uses named volumes for data persistence:

```yaml
volumes:
  redis_data_prod:  # Redis data persistence
```

### Managing Volumes

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect tupsafe-redis-data-dev

# Remove unused volumes
docker volume prune

# Remove specific volume
docker volume rm tupsafe-redis-data-dev
```

## Health Checks

All services include health checks for monitoring:

### Employee Portal
- Endpoint: `http://localhost:3000/api/health`
- Check interval: 30s
- Returns: `{"status":"healthy","timestamp":"...","service":"employee-portal"}`

### Admin Portal
- Endpoint: `http://localhost:3001/api/health`
- Check interval: 30s
- Returns: `{"status":"healthy","timestamp":"...","service":"admin-portal"}`

### AI Agent
- Endpoint: `http://localhost:8000/health`
- Check interval: 30s
- Returns: Redis connection status and service info

### Redis
- Health check: `redis-cli ping`
- Check interval: 10s

### Check Health Status

```bash
# All containers
docker-compose ps

# Specific service health
docker inspect --format='{{.State.Health.Status}}' tupsafe-employee-dev
```

## Resource Limits (Production)

Production deployment includes resource constraints:

### Employee/Admin Portals
- CPU Limit: 2 cores
- Memory Limit: 2GB
- CPU Reservation: 1 core
- Memory Reservation: 1GB

### AI Agent
- CPU Limit: 2 cores
- Memory Limit: 2GB
- CPU Reservation: 1 core
- Memory Reservation: 512MB

### Redis
- CPU Limit: 0.5 core
- Memory Limit: 512MB
- CPU Reservation: 0.25 core
- Memory Reservation: 256MB

## Security Considerations

### Development
- Uses default passwords (change for production)
- Port exposed for debugging
- Source code mounted for hot reload

### Production
- Non-root user (uid 1001) for all services
- Read-only filesystem where possible
- No new privileges flag enabled
- Secure Redis with password authentication
- Limited resource allocation
- Minimal attack surface

### Best Practices

1. **Never commit .env files with secrets**
2. **Use Docker secrets or environment variables for sensitive data**
3. **Regularly update base images**
4. **Scan images for vulnerabilities**

```bash
# Scan for vulnerabilities (requires Docker Scout or Trivy)
docker scout cves tupsafe-employee:latest
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs employee

# Check container status
docker-compose ps

# Verify environment variables
docker-compose config
```

### Port Already in Use

```bash
# Windows - Find process using port
netstat -ano | findstr :3000

# Kill process by PID
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
ports:
  - "3002:3000"  # Map host 3002 to container 3000
```

### Redis Connection Issues

```bash
# Test Redis connection
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis

# Verify network connectivity
docker-compose exec employee ping redis
```

### Build Failures

```bash
# Clean build cache
docker-compose build --no-cache

# Remove all containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose up -d --build --force-recreate
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase Docker Desktop memory (Windows/Mac)
# Settings > Resources > Memory > 8GB

# Check disk space
docker system df

# Clean up unused resources
docker system prune -a
```

## Monitoring and Logs

### Log Management

```bash
# Follow logs with timestamps
docker-compose logs -f --timestamps

# Last 100 lines
docker-compose logs --tail=100

# Logs since specific time
docker-compose logs --since 2024-01-09T10:00:00

# Export logs to file
docker-compose logs > logs.txt
```

### Production Logging

Production uses JSON file driver with rotation:
- Max file size: 50MB
- Max files: 5
- Total log retention: ~250MB per service

### Container Stats

```bash
# Real-time stats
docker stats

# Stats for specific container
docker stats tupsafe-employee-prod
```

## Backup and Restore

### Redis Data Backup

```bash
# Backup Redis data
docker-compose exec redis redis-cli BGSAVE
docker cp tupsafe-redis-prod:/data/dump.rdb ./backup/

# Restore Redis data
docker cp ./backup/dump.rdb tupsafe-redis-prod:/data/
docker-compose restart redis
```

### Volume Backup

```bash
# Backup volume to tarball
docker run --rm -v tupsafe-redis-data-prod:/data -v $(pwd):/backup \
  alpine tar czf /backup/redis-backup.tar.gz -C /data .

# Restore volume from tarball
docker run --rm -v tupsafe-redis-data-prod:/data -v $(pwd):/backup \
  alpine tar xzf /backup/redis-backup.tar.gz -C /data
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build and Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Employee Portal
        run: docker build --build-arg APP_NAME=employee -t tupsafe-employee:${{ github.sha }} .

      - name: Build Admin Portal
        run: docker build --build-arg APP_NAME=admin -t tupsafe-admin:${{ github.sha }} .

      - name: Build AI Agent
        run: docker build -t tupsafe-ai-agent:${{ github.sha }} ./services/ai-agent
```

## Development Workflow

1. **Start services**: `docker-compose up -d`
2. **Make code changes** (hot reload enabled)
3. **View logs**: `docker-compose logs -f`
4. **Run tests**: `docker-compose exec employee npm test`
5. **Stop services**: `docker-compose down`

## Production Deployment

1. **Build images**: `docker-compose -f docker-compose.prod.yml build`
2. **Tag images**: `docker tag tupsafe-employee:latest registry.example.com/tupsafe-employee:v1.0.0`
3. **Push to registry**: `docker push registry.example.com/tupsafe-employee:v1.0.0`
4. **Deploy**: `docker-compose -f docker-compose.prod.yml up -d`
5. **Verify**: Check health endpoints and logs

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [FastAPI Docker Deployment](https://fastapi.tiangolo.com/deployment/docker/)

## Support

For issues related to Docker configuration, please check:
1. This documentation
2. Docker logs (`docker-compose logs`)
3. Project README.md
4. GitHub Issues

---

**Last Updated**: January 9, 2026
**Docker Version**: 24.0+
**Docker Compose Version**: V2
