# Deployment Guide

This guide covers deployment strategies for the fullstack template, from manual Docker deployment to automated AWS infrastructure.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Manual Deployment](#manual-deployment)
- [Database Migrations](#database-migrations)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Rollback Procedures](#rollback-procedures)
- [AWS Transition Path](#aws-transition-path)
- [Troubleshooting](#troubleshooting)

## Overview

The deployment strategy uses Docker containers published to GitHub Container Registry (GHCR). This approach provides:

- **Portability**: Same images work locally, on any cloud, or on-premise
- **Consistency**: Build once, deploy anywhere
- **Traceability**: Images tagged with git commit SHA
- **AWS-ready**: Direct path to ECS Fargate deployment (step 11)

### Architecture

```
┌─────────────────────────────────────────────────┐
│              GitHub Actions                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Build   │→ │   Test   │→ │  Push GHCR   │ │
│  └──────────┘  └──────────┘  └──────────────┘ │
└─────────────────────────────────────────────────┘
                      ↓
              ┌──────────────┐
              │     GHCR     │
              │  (Registry)  │
              └──────────────┘
                      ↓
       ┌──────────────┴──────────────┐
       ↓                              ↓
┌─────────────┐              ┌──────────────┐
│   Manual    │              │     AWS      │
│ Deployment  │              │  ECS/Fargate │
│ (Step 10)   │              │  (Step 11)   │
└─────────────┘              └──────────────┘
```

## Prerequisites

### For Manual Deployment

- Docker and Docker Compose installed
- Access to GitHub Container Registry (pull permission)
- PostgreSQL database (managed or self-hosted)
- Environment variables configured

### For GitHub Actions

- GitHub repository with Actions enabled
- GitHub Personal Access Token (PAT) with `write:packages` permission (automatic via `GITHUB_TOKEN`)
- Production database URL set as repository secret

## Manual Deployment

### 1. Authenticate with GHCR

```bash
# Create a GitHub Personal Access Token with read:packages scope
# Then login to GHCR
echo $GHCR_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### 2. Pull Latest Images

```bash
# Replace OWNER/REPO with your GitHub username/repo
export IMAGE_PREFIX="ghcr.io/OWNER/REPO"

docker pull ${IMAGE_PREFIX}-api:latest
docker pull ${IMAGE_PREFIX}-web:latest
```

### 3. Prepare Environment

Create a `.env.production` file:

```bash
# Required settings
ENVIRONMENT=production
LOG_LEVEL=WARNING

# Database
DATABASE_URL=postgresql+psycopg://user:password@db-host:5432/dbname

# JWT
JWT_SECRET=your-production-secret-here
JWT_ISSUER=your-app-name
JWT_AUDIENCE=your-app-name

# CORS
CORS_ORIGINS=https://your-domain.com

# Storage (S3)
STORAGE_PROVIDER=s3
S3_BUCKET=your-production-bucket
S3_REGION=us-east-1
# S3_ENDPOINT_URL not needed for real AWS S3
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Email
EMAIL_ENABLED=true
EMAIL_FROM_ADDRESS=noreply@your-domain.com
EMAIL_FROM_NAME=Your App
EMAIL_WEB_BASE_URL=https://your-domain.com
EMAIL_SUPPORT_ADDRESS=support@your-domain.com

# Web
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
```

### 4. Create Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
name: fullstack-template-production

services:
  api:
    image: ${IMAGE_PREFIX}-api:latest
    restart: unless-stopped
    env_file:
      - .env.production
    ports:
      - "8000:8000"
    depends_on:
      - db
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  web:
    image: ${IMAGE_PREFIX}-web:latest
    restart: unless-stopped
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

  # Optional: Include database if self-hosting
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
```

### 5. Deploy

```bash
# Set your image prefix
export IMAGE_PREFIX="ghcr.io/OWNER/REPO"

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check health
curl http://localhost:8000/health
```

## Database Migrations

### Migration Safety Script

The `apps/api/scripts/migrate.py` script provides safe migration execution with:

- **Pre-flight checks**: Connectivity, pending migrations, destructive operation detection
- **Dry-run mode**: Preview migrations without applying
- **Backup verification**: Ensures backups exist before applying
- **Post-migration validation**: Verifies schema integrity
- **Detailed logging**: All operations are logged with timestamps

### Running Migrations

#### Local Development

```bash
cd apps/api

# Check current database version
python scripts/migrate.py current

# Preview pending migrations (dry-run)
python scripts/migrate.py upgrade --dry-run

# Apply migrations
python scripts/migrate.py upgrade
```

#### Production Deployment

```bash
cd apps/api

# Always dry-run first in production
DATABASE_URL=$PRODUCTION_DB_URL python scripts/migrate.py upgrade --dry-run

# If dry-run looks good, apply migrations
# Note: Ensure database backups are enabled at the infrastructure level
DATABASE_URL=$PRODUCTION_DB_URL python scripts/migrate.py upgrade --no-backup-check

# Verify migration succeeded
DATABASE_URL=$PRODUCTION_DB_URL python scripts/migrate.py current
```

#### Migration Flags

- `--dry-run`: Preview without applying changes
- `--no-backup-check`: Skip backup verification (use when backups are automated)
- `--allow-destructive`: Allow DROP/TRUNCATE operations
- `--target <revision>`: Migrate to specific revision instead of head

### Creating New Migrations

```bash
cd apps/api

# Auto-generate migration from model changes
alembic revision --autogenerate -m "description of changes"

# Review the generated migration file in alembic/versions/
# Edit if necessary to ensure safety

# Test locally
python scripts/migrate.py upgrade --dry-run
```

### Migration Best Practices

1. **Always test migrations locally first**
2. **Review auto-generated migrations** - Alembic may not detect all changes
3. **Avoid destructive operations in production** without explicit approval
4. **Keep migrations reversible** - Write downgrade functions
5. **Coordinate with deployments** - Ensure backward-compatible schema changes
6. **Backup before major migrations** - Use your database provider's backup tools

## GitHub Actions CI/CD

### CI Workflow (Pull Requests)

On every PR, the CI workflow runs:

1. **Web checks**: Biome (linting), Vitest (unit tests), Playwright (e2e tests)
2. **API checks**: Ruff (linting), Pytest (unit tests)
3. **Docker builds**: Build both production images and test health endpoints

This ensures PRs don't break production builds.

### Deploy Workflow (Push to main)

On push to `main`, the deploy workflow:

1. **Builds images**: Creates production Docker images for API and Web
2. **Tags images**: 
   - `main-{sha}` - specific commit
   - `latest` - most recent main branch build
3. **Pushes to GHCR**: Images published to GitHub Container Registry
4. **Runs migrations**: Applies pending database migrations with safety checks
5. **Creates release**: GitHub release with deployment summary and image tags

### Setting Up Secrets

In your GitHub repository settings, add these secrets:

- `PRODUCTION_DATABASE_URL`: Full PostgreSQL connection string
  ```
  postgresql+psycopg://user:password@host:5432/dbname
  ```

The `GITHUB_TOKEN` is automatically provided by Actions for GHCR authentication.

### Manual Workflow Trigger

You can manually trigger deployment from GitHub Actions:

1. Go to Actions → Deploy
2. Click "Run workflow"
3. Optionally check "Skip database migration" if needed

## Rollback Procedures

### Rolling Back Code

#### Option 1: Redeploy Previous Image

```bash
# Find previous successful deployment
gh release list

# Pull the specific version
docker pull ghcr.io/OWNER/REPO-api:main-abc1234
docker pull ghcr.io/OWNER/REPO-web:main-abc1234

# Update docker-compose to use specific tags
# Then restart services
docker-compose -f docker-compose.prod.yml up -d
```

#### Option 2: Revert Git Commit

```bash
# Revert the problematic commit
git revert <commit-hash>
git push origin main

# This triggers a new deployment with the revert
```

### Rolling Back Database Migrations

⚠️ **Caution**: Database rollbacks are risky. Always backup first.

```bash
cd apps/api

# View migration history
python scripts/migrate.py history

# Downgrade to previous revision
alembic downgrade -1

# Or downgrade to specific revision
alembic downgrade <revision>

# Verify
python scripts/migrate.py current
```

### Rollback Checklist

- [ ] Identify the last known good deployment
- [ ] Backup current database state
- [ ] Check for data migrations that may have modified data
- [ ] Coordinate with team - announce maintenance window if needed
- [ ] Rollback application code first
- [ ] Test application with current database schema
- [ ] Only rollback database if necessary
- [ ] Verify application health after rollback
- [ ] Document what went wrong and update runbooks

## AWS Transition Path (Step 11)

The Docker foundation built in step 10 enables smooth transition to AWS infrastructure.

### Current State (Step 10)

```
GitHub Actions → GHCR → Manual Docker Deployment
```

### Future State (Step 11)

```
GitHub Actions → GHCR → AWS ECS Fargate (via Terraform)
                         ↓
                    AWS RDS PostgreSQL
                    AWS S3 (already configured)
                    AWS Secrets Manager
                    AWS ALB (Load Balancer)
```

### What Stays the Same

- **Same Docker images**: ECS pulls from GHCR
- **Same migration script**: Run as ECS task before deployment
- **Same environment variables**: Loaded from Secrets Manager
- **Same storage config**: Already using real S3

### What Changes in Step 11

#### 1. Infrastructure as Code (Terraform)

Create `infra/terraform/` with:

```hcl
# VPC and networking
resource "aws_vpc" "main" { ... }

# RDS PostgreSQL
resource "aws_rds_instance" "postgres" {
  engine = "postgres"
  engine_version = "16"
  # Store connection string in Secrets Manager
}

# ECS Cluster
resource "aws_ecs_cluster" "main" { ... }

# Task definitions (reference GHCR images)
resource "aws_ecs_task_definition" "api" {
  container_definitions = jsonencode([{
    image = "ghcr.io/OWNER/REPO-api:latest"
    # Environment from Secrets Manager
  }])
}

# ALB for load balancing
resource "aws_lb" "main" { ... }

# Secrets Manager for sensitive config
resource "aws_secretsmanager_secret" "db" { ... }
```

#### 2. Updated Deploy Workflow

```yaml
# After pushing images to GHCR...

- name: Update ECS service
  run: |
    aws ecs update-service \
      --cluster production \
      --service api \
      --force-new-deployment
```

#### 3. Migration as ECS Task

```yaml
- name: Run migrations
  run: |
    aws ecs run-task \
      --cluster production \
      --task-definition migration \
      --launch-type FARGATE
```

### Migration Steps to AWS

1. **Set up AWS account and credentials**
2. **Create Terraform configuration** (see `infra/terraform/`)
3. **Apply infrastructure**: `terraform apply`
4. **Update GitHub secrets** with AWS credentials
5. **Update deploy workflow** to use ECS instead of manual deployment
6. **Test deployment to staging environment first**
7. **Promote to production** after validation

### Cost Estimates (AWS)

For a small production deployment:

- **ECS Fargate**: ~$30-50/month (2 tasks, 0.5 vCPU, 1GB RAM each)
- **RDS PostgreSQL**: ~$15-30/month (db.t4g.micro with 20GB storage)
- **ALB**: ~$20/month (base cost + data transfer)
- **S3**: ~$5/month (depends on usage)
- **Secrets Manager**: ~$1/month (2 secrets)
- **Data transfer**: Variable

**Total**: ~$70-110/month for production + ~$50/month for dev environment

You can reduce costs with:
- Single-AZ RDS for dev
- Smaller instance types
- Reserved instances (1-year commitment)
- AWS Free Tier (first 12 months)

## Troubleshooting

### Images Won't Pull from GHCR

**Problem**: `Error response from daemon: unauthorized`

**Solution**:
```bash
# Ensure package is public in GitHub settings, or
# Login with proper credentials
echo $GHCR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### Migration Fails with "Destructive Operation Detected"

**Problem**: Migration script blocks DROP/ALTER operations

**Solution**:
```bash
# Review the migration carefully
python scripts/migrate.py upgrade --dry-run

# If safe to proceed
python scripts/migrate.py upgrade --allow-destructive
```

### Container Exits Immediately

**Problem**: Container starts but exits right away

**Solution**:
```bash
# Check logs
docker logs <container-name>

# Common issues:
# - Missing required environment variables
# - Database connection failure
# - Port already in use

# Verify environment variables
docker exec <container-name> env
```

### Health Check Failing

**Problem**: Container shows "unhealthy" status

**Solution**:
```bash
# Check health endpoint manually
docker exec <container-name> curl localhost:8000/health

# View detailed logs
docker logs <container-name>

# Adjust health check timing if startup is slow
# Increase start_period in docker-compose.yml
```

### Migration Script Can't Connect to Database

**Problem**: `OperationalError: could not connect to server`

**Solution**:
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connectivity manually
psql $DATABASE_URL -c "SELECT 1"

# Check if database is running (if self-hosted)
docker-compose ps db

# Check firewall rules (cloud databases)
```

### GitHub Actions Workflow Fails

**Problem**: Deploy workflow fails to push images

**Solution**:
1. Check workflow logs in GitHub Actions tab
2. Verify repository has packages write permission
3. Ensure `PRODUCTION_DATABASE_URL` secret is set
4. Check that Docker builds succeed in CI workflow first

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

For questions or issues, see the repository's issue tracker or refer to the README.
