# Luma CMS API

Backend API for the Luma Content Management System built with Hono, TypeScript, and SQLite.

## Features

- 🚀 **Hono Framework** - Fast, lightweight, and modern
- 🛡️ **Type Safety** - Full TypeScript support with Zod validation
- 🗃️ **SQLite Database** - Simple file-based database with Drizzle ORM
- 🧱 **Component Management** - CRUD operations for components and controls
- 🔄 **Auto Migrations** - Database schema versioning

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Database Setup

```bash
# Generate migration files
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open database studio (optional)
pnpm db:studio
```

### Development

```bash
pnpm dev
```

The API will be available at `http://localhost:3002`

## API Endpoints

### Components

- `GET /api/components` - List all components
- `POST /api/components` - Create a new component
- `GET /api/components/:id` - Get component by ID
- `PUT /api/components/:id` - Update component
- `DELETE /api/components/:id` - Delete component

### Component Controls

- `POST /api/components/:id/controls` - Add control to component
- `PUT /api/components/:id/controls/:controlId` - Update control
- `DELETE /api/components/:id/controls/:controlId` - Delete control

## Database Schema

### Components Table

- `id` - Primary key (text)
- `name` - Component name (text, required)
- `description` - Component description (text, optional)
- `type` - Component type: 'primitive' or 'user-defined'
- `created_at` - Timestamp
- `updated_at` - Timestamp
- `team_id` - For future teams feature
- `created_by` - For user tracking

### Component Controls Table

- `id` - Primary key (text)
- `component_id` - Foreign key to components
- `control_type` - Type of control (text)
- `label` - Control label (text)
- `config` - JSON configuration (text)
- `order_index` - Display order (integer)

## Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:generate` - Generate migration files
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio
