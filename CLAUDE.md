# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Society (Luxe)** is Vietnam's first ultra-premium verified professional networking platform connecting high-income professionals (800M+ VND annually) with elite university students from top institutions.

This is a **split monorepo** structure with two independent Git repositories in a parent folder:
- `society-mobile/` - React Native mobile app (standalone repo)
- `society-backend/` - pnpm workspace monorepo containing server and client apps

## Repository Structure

```
society-monorepo/
├── society-mobile/          # React Native + Expo mobile app (standalone)
│   └── src/
│       ├── api/             # React Query + react-query-kit
│       ├── app/             # Expo Router screens
│       ├── components/      # UI components (NativeWind)
│       ├── lib/             # Auth, hooks, i18n, storage
│       └── translations/    # i18n JSON files
│
└── society-backend/         # pnpm workspace monorepo
    ├── apps/
    │   ├── server/          # NestJS API (Fastify)
    │   │   └── src/
    │   │       ├── auth/          # JWT authentication
    │   │       ├── modules/       # Feature modules
    │   │       │   ├── admin/
    │   │       │   ├── ai/
    │   │       │   ├── events/
    │   │       │   ├── files/
    │   │       │   ├── invitation/
    │   │       │   ├── matching/
    │   │       │   ├── messaging/
    │   │       │   ├── moderation/
    │   │       │   ├── notifications/
    │   │       │   ├── payments/
    │   │       │   ├── referral/
    │   │       │   ├── security/
    │   │       │   ├── transactions/
    │   │       │   ├── users/
    │   │       │   └── verification/
    │   │       └── prisma/        # Database client
    │   └── client/          # Next.js web app (React Native copy)
    └── packages/
        └── common/          # Shared utilities and Supabase config
```

## Package Manager

**Critical**: Both projects use **pnpm** exclusively.
- `society-mobile/` enforces pnpm via preinstall hook
- `society-backend/` uses pnpm workspaces

```bash
# Never use npm or yarn
pnpm install  # Correct
npm install   # Will fail
```

## Commands

### Mobile App (society-mobile/)

```bash
cd society-mobile

# Development
pnpm start              # Expo dev server
pnpm ios                # iOS simulator
pnpm android            # Android emulator

# Build
pnpm prebuild           # Generate native projects
pnpm build:development:ios
pnpm build:production:ios

# Quality
pnpm lint
pnpm type-check
pnpm test
pnpm check-all          # All checks (CI)
```

### Backend (society-backend/)

```bash
cd society-backend

# Development (runs all apps concurrently)
pnpm dev

# Individual apps
pnpm --filter server dev     # NestJS API only
pnpm --filter client dev     # Next.js client only

# Build
pnpm build                   # Build all
pnpm build:common            # Build shared package first

# Testing
pnpm test                    # Run all tests
pnpm lint                    # Lint all packages
```

### Server-specific (society-backend/apps/server/)

```bash
cd society-backend/apps/server

pnpm dev                # Watch mode
pnpm build              # Production build
pnpm start              # Run production
pnpm test               # Jest tests
```

## Tech Stack

### Mobile (society-mobile/)
- React Native 0.79 + Expo SDK 53
- Expo Router v5 (file-based navigation)
- NativeWind (Tailwind CSS)
- React Query + react-query-kit
- Zustand (state management)
- MMKV (storage)
- Supabase client

### Backend (society-backend/)
- NestJS 11 + Fastify
- Prisma 7 (PostgreSQL)
- Supabase (auth, database, realtime)
- Redis (Railway)
- Cloudflare R2 (file storage)
- Google Generative AI

## Key Architecture Patterns

### Mobile App

**Environment System**: Three environments (development, staging, production)
- Use `APP_ENV` to switch: `APP_ENV=staging pnpm start`
- Custom env loading via `@env` alias (not Expo's `.env`)

**Auth**: Custom JWT-based auth with Zustand (despite Clerk being installed)
- `hydrateAuth()` loads tokens at startup
- Tokens persisted in MMKV storage

**API Calls**: Use react-query-kit factory pattern
```typescript
export const usePosts = createQuery<Response, Variables, AxiosError>({
  queryKey: ['posts'],
  fetcher: (variables) => client.get('posts').then(res => res.data.posts),
});
```

**Components**: Functional only, NativeWind styling, tailwind-variants
```typescript
type Props = { title: string };
export function Card({ title }: Props) {
  return <View className="rounded-lg bg-white p-4">...</View>;
}
```

### Backend

**Module Organization**: Feature-based NestJS modules
- Each module: controller, service, DTOs, entities
- Shared Prisma client via `PrismaService`

**Authentication**: JWT with Passport
- Supabase for user management
- Custom guards for role-based access

**Database**: Prisma with PostgreSQL adapter
- Generated types in `src/generated/`
- Migrations via Prisma

## Code Conventions

### TypeScript
- Use `type` over `interface`
- Use `const` with `as const` instead of enums
- Explicit return types for all functions
- Absolute imports: `@/` for mobile, standard paths for backend

### Naming
- Files: `kebab-case` (e.g., `login-form.tsx`)
- Components: `PascalCase`
- Test files: `*.test.tsx` co-located with implementation

### Git Commits (Conventional Commits)
```
feat: add user authentication
fix: resolve login redirect issue
refactor: simplify matching algorithm
test: add unit tests for payments
docs: update API documentation
chore: update dependencies
```

### Package Installation
- Mobile: Use `npx expo install <package>` for RN packages
- Backend: Use `pnpm add <package>` normally

## Deployment

- **Mobile**: EAS Build for iOS/Android
- **Backend API**: Railway (Docker), Vercel (serverless option)
- **Database**: Supabase PostgreSQL
- **Cache**: Railway Redis
- **Storage**: Cloudflare R2

## Common Pitfalls

1. **Don't mix package managers** - pnpm only
2. **Mobile RN packages**: Use `npx expo install`, not `pnpm add`
3. **Backend builds**: Run `pnpm build:common` before other builds
4. **Environment variables**: Mobile uses custom `@env` system, not Expo's `.env`
5. **Auth**: Mobile uses custom JWT auth, not Clerk (despite Clerk being installed)
6. **Two repos**: This is two Git repos in one folder, commit separately

## Sub-project Documentation

Detailed documentation exists in each sub-project:
- `society-mobile/CLAUDE.md` - Comprehensive mobile app guide
- `society-backend/CLAUDE.md` - Project context and business overview
- `society-backend/apps/client/CLAUDE.md` - Web client (mirrors mobile patterns)
