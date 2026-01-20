# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coach Sidekick is an AI-powered coaching assistant application that helps coaches during meetings by providing real-time transcript analysis and coaching suggestions. The app uses the Recall.ai API for meeting transcription and integrates with Supabase for authentication and data persistence.

## Development Commands

```bash
# Start development server with Turbopack (fast builds)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

**Package Manager**: This project uses `pnpm` (version 8.12.0+). Always use `pnpm` commands instead of `npm` or `yarn`.

## Architecture Overview

### Core Components

- **Recall.ai Integration**: Real-time meeting transcription via webhooks (`/api/recall/webhook`)
- **Transcript Store**: In-memory transcript management with batch saving to database (`transcript-store.ts`)
- **Coaching Analysis**: OpenAI-powered conversation analysis for coaching insights (`coaching-analysis.ts`)
- **Supabase**: Authentication and data persistence
- **Real-time UI**: Live transcript display and coaching suggestions

### Key API Routes

- `/api/recall/webhook` - Receives real-time transcript data from Recall.ai
- `/api/recall/create-bot` - Creates new meeting bots
- `/api/recall/stop-bot/[botId]` - Stops recording bots
- `/api/coaching/analyze/[botId]` - Triggers coaching analysis
- `/api/meetings/*` - Meeting session management and transcript persistence

### Data Flow

1. Meeting bot created via Recall.ai API
2. Real-time transcript events received at webhook endpoint
3. Transcript entries stored in memory (`TranscriptStore`)
4. Coaching analysis triggered periodically via OpenAI
5. Batch saves to Supabase database for persistence
6. UI displays live transcripts and coaching suggestions

## Technical Stack

- **Framework**: Next.js 15.3.4 with App Router
- **Runtime**: React 19
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI API for coaching analysis
- **Meeting Integration**: Recall.ai API

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RECALL_API_TOKEN=
OPENAI_API_KEY=
```

## Code Conventions

- **File Naming**: kebab-case for files (`meeting-form.tsx`), PascalCase for components (`MeetingForm`)
- **Import Order**: React/Next.js → Third-party → Internal (@/ aliases) → Relative
- **Path Aliases**: Use `@/` for imports from `src/` directory
- **Types**: Defined in `src/types/` with interfaces for core entities (`Bot`, `TranscriptEntry`)

## Git Conventions

- **Do NOT include Claude as a co-author in commit messages** - Omit the `Co-Authored-By: Claude` line from all commits
- Write clear, concise commit messages that describe the "why" rather than just the "what"

## Key Services & Stores

- `transcriptStore` - In-memory session management with batch saving logic
- `coachingAnalysisService` - OpenAI integration for conversation analysis
- `batchSaveService` - Database persistence with batching for performance
- `supabase` - Database client and authentication

## Testing & Development

- Run development server with `pnpm dev` (uses Turbopack for fast builds)
- Check TypeScript errors with `pnpm build` before committing
- Follow ESLint rules with `pnpm lint`
- UI components use Radix UI primitives with Tailwind styling

## Session Management

The app maintains real-time session state in memory (`TranscriptStore`) with periodic database saves. Sessions include:

- Bot status and meeting metadata
- Real-time transcript entries (both partial and final)
- Batch save tracking to prevent data loss
- Automatic cleanup of old sessions (24h default)

## Database Access

Claude has access to run database migrations and execute SQL queries on the Supabase database. The backend configuration is in `coach-sidekick-backend/.env`.

### Running Migrations

```bash
cd coach-sidekick-backend
poetry run alembic upgrade head
```

### Key Data Constraints

- **Client email**: Globally unique across all clients (enforced via `uq_client_email_global` index)
- Client emails are optional but if provided, must be unique system-wide
- Use SQL to query/manage duplicate data before running migrations that add unique constraints
