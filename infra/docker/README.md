# Docker Development Environment

This directory contains Docker configuration for local development.

## Services

- **PostgreSQL 15**: Main database
- **Redis 7**: Caching and session storage
- **Adminer**: Database management UI

## Quick Start

```bash
# Start all services
pnpm docker:dev

# Stop all services
pnpm docker:down

# View logs
docker-compose -f infra/docker/docker-compose.dev.yml logs -f

# Connect to PostgreSQL
docker exec -it <postgres_container_id> psql -U postgres -d seo_portal
```

## Service URLs

- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Adminer**: `http://localhost:8080`
  - Server: `postgres`
  - Username: `postgres`
  - Password: `postgres`
  - Database: `seo_portal`

## Environment Variables

Make sure your `.env` file includes:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/seo_portal"
REDIS_URL="redis://localhost:6379"
```