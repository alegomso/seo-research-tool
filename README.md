# SEO Research Portal

Internal SEO Research Portal powered by DataForSEO APIs and AI-assisted analysis.

## Overview

A lightweight, internal web application that combines **DataForSEO APIs** with **AI-assisted analysis** to help marketing teams run quick research, generate insights, and produce shareable briefs—without jumping across tools.

## Features

### Core Workflows (MVP)
1. **Keyword Discovery** - Seed term analysis with Google Ads data and trends
2. **SERP Snapshot** - Real-time SERP analysis with intent mapping
3. **Competitor Overview** - Domain competition analysis
4. **Backlink Check** - High-level authority signals and referring domains
5. **OnPage Check** - Basic technical SEO audit
6. **Content Brief Generator** - AI-powered content briefs with export capabilities

### User Roles
- **Marketer** - Run research, view dashboards, generate briefs
- **Analyst** - Advanced filters/exports, prompt editing, manage presets
- **Admin** - User management, budget controls, API keys, data retention

## Tech Stack

- **Frontend**: Next.js 14 + React 18 + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Fastify + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Authentication**: NextAuth.js with Google SSO
- **APIs**: DataForSEO + OpenAI GPT-4
- **Infrastructure**: Docker + Turborepo monorepo

## Project Structure

```
seo-portal/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── server/       # Fastify backend API
├── packages/
│   ├── shared/       # Shared types, schemas, utilities
│   ├── ui/           # Shared UI components (future)
│   ├── eslint-config/# ESLint configurations
│   └── tsconfig/     # TypeScript configurations
├── prompts/          # AI prompt templates
├── docs/             # Documentation and API contracts
├── infra/            # Docker and deployment configuration
├── .env.example      # Environment variables template
└── README.md         # This file
```

## 🚀 Quick Deployment (Non-Technical Users)

**New!** We've added one-click deployment options for non-technical teams:

### ⚡ **Fastest Setup** (15-30 minutes)
```bash
# 1. Run the setup wizard
pnpm setup

# 2. Validate configuration
pnpm validate-env

# 3. Deploy to Railway (easiest)
# Follow the deployment guide for your preferred platform
```

**Deployment Options**:
- 🚄 **Railway** - One-click deployment ($20-50/month)
- 🎨 **Render** - Managed platform ($35-50/month)
- ▲ **Vercel** - Frontend deployment (free tier available)
- 🐳 **Docker** - Self-hosted ($15-40/month)

📖 **[Complete Deployment Guide](./DEPLOYMENT-GUIDE.md)** - Step-by-step instructions for all options

### 🛠️ New Management Tools
```bash
pnpm setup              # Interactive setup wizard
pnpm validate-env       # Validate configuration
pnpm health-check       # Check system health
pnpm health-monitor     # Continuous monitoring
pnpm generate-secrets   # Generate secure keys
```

## Getting Started (Development)

### Prerequisites

- Node.js 18+ and pnpm 8+
- Docker and Docker Compose
- DataForSEO API account
- OpenAI API account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd seo-portal
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Start development services**
   ```bash
   # Start PostgreSQL and Redis
   pnpm docker:dev

   # Run database migrations (in another terminal)
   pnpm db:migrate

   # Start development servers
   pnpm dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/docs
   - Database Admin: http://localhost:8080

### Environment Configuration

Copy `.env.example` to `.env` and configure:

#### Required API Keys
- **DataForSEO**: Get credentials from [dataforseo.com](https://dataforseo.com)
- **OpenAI**: Get API key from [platform.openai.com](https://platform.openai.com)

#### Optional SSO Configuration
- **Google OAuth**: For single sign-on integration

#### Database & Cache
- **PostgreSQL**: Configured automatically with Docker
- **Redis**: Configured automatically with Docker

## Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all development servers
pnpm build            # Build all applications
pnpm test             # Run tests
pnpm lint             # Lint all code
pnpm typecheck        # Type check all code

# Database
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed database with sample data
pnpm db:reset         # Reset database
pnpm db:studio        # Open Prisma Studio

# Docker
pnpm docker:dev       # Start development services
pnpm docker:down      # Stop development services
```

### Architecture

#### Backend Services
- **API Routes**: RESTful endpoints for each feature
- **DataForSEO Integration**: Async task management with polling
- **OpenAI Integration**: AI-powered insights and brief generation
- **Caching Layer**: Redis for DataForSEO response caching
- **Authentication**: JWT with NextAuth.js integration

#### Frontend Features
- **Dashboard**: Usage overview and recent research
- **Research Forms**: Input forms for each query type
- **Results Display**: Tables, charts, and data visualization
- **AI Insights**: Contextual AI-powered analysis
- **Brief Editor**: Rich text editor with templates
- **Export System**: Multiple format support

## API Integration

### DataForSEO Endpoints
- SERP: Google Organic + Maps
- Keywords: Google Ads + Trends
- Labs: Keyword Suggestions + SERP Competitors
- Backlinks: Summary + Referring Domains
- OnPage: Basic crawl and analysis

### AI Features
- **Keyword Opportunity Scan**: Automated keyword prioritization
- **SERP Intent Map**: Content format and intent analysis
- **Brief Writer**: Complete content brief generation

## Security & Compliance

- Internal access only (VPN/SSO required)
- API keys stored securely
- Rate limiting and budget controls
- Minimal PII collection
- Compliance with provider ToS

## Contributing

1. Create a feature branch
2. Follow the established code style
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## License

Internal use only - All rights reserved.