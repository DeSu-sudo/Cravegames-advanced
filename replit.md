# CraveGames

## Overview

CraveGames is a gaming platform web application that allows users to browse, play, and interact with browser-based games. The platform features user authentication, game categories, favorites, ratings, comments, a virtual currency system (Crave Coins), and an avatar store. The application follows a Steam/Discord-inspired dark gaming aesthetic with responsive design optimized for both desktop and mobile devices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom gaming-themed dark mode design tokens
- **Build Tool**: Vite with React plugin

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/` (Home, Category, GameDetail, Store, etc.)
- Reusable components in `client/src/components/` (games/, layout/, ui/)
- Custom hooks in `client/src/hooks/`
- API communication centralized through `client/src/lib/queryClient.ts`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Session Management**: Express-session with cookie-based authentication
- **Password Hashing**: bcrypt
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

The server is structured as:
- `server/index.ts`: Express app setup and middleware
- `server/routes.ts`: API route definitions with auth middleware
- `server/storage.ts`: Data access layer interface (abstracts database operations)
- `server/db.ts`: Drizzle database connection

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema**: Defined in `shared/schema.ts` using Drizzle ORM
- **Migrations**: Managed via drizzle-kit (`npm run db:push`)

Key database tables:
- `users`: Authentication and profile data (includes crave coins, active avatar)
- `categories`: Game categories with icons
- `games`: Game metadata (name, description, URLs, ratings, play counts)
- `favorites`: User-game relationships
- `ratings`: User ratings for games
- `comments`: User comments on games
- `storeItems`: Purchasable avatar items
- `inventory`: User-owned items

### Authentication
- Session-based authentication using express-session
- Passwords hashed with bcrypt (10 salt rounds)
- Session stored in cookies (7-day expiry)
- Middleware functions `requireAuth` and `requireAdmin` for route protection

### API Structure
All API routes are prefixed with `/api/`:
- Auth: `/api/login`, `/api/register`, `/api/logout`, `/api/me`
- Games: `/api/games`, `/api/game/:id`, `/api/category/:name`, `/api/home`
- Interactions: `/api/favorite/:id`, `/api/rate/:id`, `/api/comment/:id`
- Store: `/api/store`, `/api/store/buy/:id`, `/api/inventory`
- Coins: `/api/coins/click`
- Admin: CRUD endpoints for games, categories, store items

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: PostgreSQL session store (available but not currently configured)

### UI/Frontend Libraries
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library
- **class-variance-authority**: Component variant management
- **react-hook-form + zod**: Form handling and validation
- **date-fns**: Date formatting utilities
- **embla-carousel-react**: Carousel functionality

### Monetization
- **Google AdSense**: Ad integration configured (pub-5485599177157755) for horizontal and vertical ad placements

### Development Tools
- **Vite**: Development server with HMR
- **esbuild**: Production bundling for server
- **drizzle-kit**: Database migration tooling
- **Replit plugins**: Dev banner, cartographer, runtime error overlay (development only)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption (defaults to fallback in development)