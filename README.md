# Larago

A full-stack SaaS platform designed for high scalability and secure multi-tenancy. Larago provides a comprehensive project management and collaboration solution with modular architecture.

## 🚀 Features

### Core Capabilities

- **Dashboard** - Centralized overview with analytics and insights
- **Project Management** - Create, organize, and track projects
- **Task Management** - Comprehensive task tracking with assignments and deadlines
- **Team Collaboration** - Team management and member coordination
- **Access Control (RBAC)** - Role-based access control with granular permissions
- **Notifications** - Real-time notification system
- **Webhooks** - Event-driven integrations with external services
- **User Management** - Complete authentication and user administration
- **Modular System** - Dynamic module loading and management

## What You Can Do Today

- **Sign up and log in** at `/register` or `/login`, then land in the dashboard.
- **Create a workspace (team)** in `/dashboard/teams`, invite members, and manage roles/permissions in `/dashboard/access` (current UI assumes Team ID 1).
- **Plan work** by creating projects under a team in `/dashboard/projects`, then add and update tasks in `/dashboard/tasks` (To Do → In Progress → Done).
- **Keep people informed** with in-app notifications at `/dashboard/notifications` and outbound webhooks at `/dashboard/webhooks` (events like `project.created` or `task.updated`).
- **Admin-only views** live under `/admin/*` for user, team, and system health monitoring (requires a superuser token).
- **Public module pages** are served from `/public/*` via the module registry (see `src/modules/registry_gen.ts`).

### 5-Minute API Walkthrough (works against http://localhost:8080)

```bash
# 1) Register and log in
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo User","email":"demo@example.com","password":"Passw0rd!"}'

# 2) Create a team (use the bearer token from the login response)
curl -X POST http://localhost:8080/api/v1/teams \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Team","slug":"demo"}'

# 3) Create a project inside that team (pass X-Team-ID)
curl -X POST http://localhost:8080/api/v1/teams/<TEAM_ID>/projects \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-Team-ID: <TEAM_ID>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Website Redesign","description":"Front page refresh"}'

# 4) Add a task to the project
curl -X POST http://localhost:8080/api/v1/projects/<PROJECT_ID>/tasks \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Wireframes","description":"Create hero section", "status":"TODO", "priority":"MEDIUM"}'

# 5) Subscribe a webhook
curl -X POST http://localhost:8080/api/v1/webhooks \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://webhook.site/your-id","events":["task.created","task.updated"]}'
```

### Authentication & Security

- **Secure Authentication** - JWT-based auth with HttpOnly cookies
- **Email Verification** - Email confirmation workflow
- **Password Reset** - Secure password recovery flow
- **CSRF Protection** - Built-in CSRF protection
- **Multi-tenancy** - Secure tenant isolation

### Admin Features

- **User Administration** - Manage users and permissions
- **Module Management** - Enable/disable modules dynamically
- **Settings Configuration** - Customizable application settings

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Language**: Go 1.22+
- **Framework**: Gin Web Framework
- **Architecture**: Domain-Driven Design (DDD)
- **Database**: MySQL 8.0
- **Caching**: Redis 7
- **Task Queue**: Asynq (Redis-based)
- **Migrations**: golang-migrate
- **Config**: Viper

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Development**: Air (hot reload for Go)
- **Monorepo**: Unified backend/frontend versioning

## 📁 Project Structure

```
larago/
├── backend/              # Go backend
│   ├── cmd/api/         # Application entrypoint
│   ├── internal/        # Private application code
│   │   ├── config/      # Configuration management
│   │   ├── domain/      # Business entities & interfaces
│   │   ├── http/        # HTTP handlers & middleware
│   │   ├── service/     # Business logic layer
│   │   └── repo/        # Data access layer
│   ├── db/migrations/   # Database migrations
│   └── pkg/             # Public shared libraries
│
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── app/         # Next.js App Router pages
│   │   ├── components/  # Reusable React components
│   │   ├── lib/         # Utilities & API client
│   │   ├── modules/     # Dynamic module system
│   │   └── types/       # TypeScript definitions
│   └── public/          # Static assets
│
└── docs/                # Documentation
    ├── architecture.md  # System architecture
    ├── api-contract.md  # API specifications
    └── standards.md     # Coding standards
```

## 🚦 Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (recommended)
- **Node.js** 20+ (for local frontend development)
- **Go** 1.22+ (for local backend development)
- **MySQL** 8.0 (if not using Docker)
- **Redis** 7+ (if not using Docker)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd larago
   ```

2. **Start all services**
   ```bash
   make dev
   # or
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8080](http://localhost:8080)

4. **Stop services**
   ```bash
   make stop
   # or
   docker-compose down
   ```

### Local Development (Frontend Only)

If you want to run the frontend locally while using Docker for backend services:

1. **Start backend services**
   ```bash
   docker-compose up -d mysql redis api
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

The frontend will auto-reload when you edit files in `src/app/` or `src/components/`.

### Local Development (Backend Only)

1. **Start database services**
   ```bash
   docker-compose up -d mysql redis
   ```

2. **Run migrations**
   ```bash
   make migrate-up
   ```

3. **Start the backend**
   ```bash
   cd backend
   go run cmd/api/main.go
   # or with hot reload
   air -c .air.toml
   ```

## 📚 Available Scripts

### Root Level (Makefile)

```bash
make help           # Show all available commands
make dev            # Start development environment
make stop           # Stop development environment
make build-backend  # Build backend binary
make test-backend   # Run backend tests
make migrate-up     # Run database migrations
make migrate-down   # Rollback migrations
make migrate-create name=<name>  # Create new migration
```

### Frontend

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

### Backend

```bash
go run cmd/api/main.go  # Run backend
go test ./...           # Run tests
go build -o bin/api     # Build binary
```

## 🔧 Configuration

### Environment Variables

**Backend** (`.env` in `backend/`):
```env
APP_ENVIRONMENT=dev
APP_SERVER_PORT=8080
APP_DATABASE_DSN=user:password@tcp(localhost:3306)/larago?parseTime=true
APP_REDIS_ADDR=localhost:6379
APP_JWT_SECRET=your-secret-key
```

**Frontend** (`.env.local` in `frontend/`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## 🗄️ Database Migrations

Create a new migration:
```bash
make migrate-create name=add_users_table
```

Run migrations:
```bash
make migrate-up
```

Rollback migrations:
```bash
make migrate-down
```

## 🔌 Module System

Larago features a dynamic module system that allows enabling/disabling features at runtime:

- Modules are defined in `frontend/src/modules/`
- Module registry is auto-generated
- Enable/disable modules via the admin panel at `/dashboard/settings/modules`
- Modules can add routes, navigation items, and custom views

## 📖 API Documentation

The API follows RESTful conventions with a standard envelope format:

**Base URL**: `http://localhost:8080/api/v1`

**Response Format**:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 100 },
  "error": null
}
```

See [docs/api-contract.md](../docs/api-contract.md) for complete API documentation.

## 🏗️ Architecture

Larago follows modern architectural patterns:

- **Backend**: Standard Go Project Layout with DDD influences
- **Frontend**: Next.js App Router with Feature-Sliced Design
- **Security**: HttpOnly cookies, CSRF protection, RBAC middleware
- **Scalability**: Stateless API, Redis caching, async job processing

See [docs/architecture.md](../docs/architecture.md) for detailed architecture documentation.

## 🚀 Deployment

### Production Build

**Frontend**:
```bash
cd frontend
npm run build
npm run start
```

**Backend**:
```bash
cd backend
go build -o bin/api cmd/api/main.go
./bin/api
```

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Follow the coding standards in [docs/standards.md](../docs/standards.md)
2. Write tests for new features
3. Update documentation as needed
4. Submit pull requests for review

## 📄 License

[Add your license here]

## 🆘 Support

For issues and questions:
- Check the [documentation](../docs/)
- Review existing issues
- Create a new issue with detailed information

---

Built with ❤️ using Next.js and Go
