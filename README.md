# NewCoach

A full-featured fitness coaching platform built with Expo (React Native) and Supabase. Supports both Coach and Client roles with workout programming, progress tracking, real-time messaging, habit tracking, nutrition logging, and milestone badges.

## Tech Stack

- **Frontend**: Expo (React Native) with TypeScript, Expo Router
- **UI**: React Native Paper (Material Design 3)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **State**: Zustand + TanStack React Query
- **Notifications**: Expo Notifications

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A [Supabase](https://supabase.com) project (free tier works)

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase**

   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

   Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

3. **Run database migrations**

   Execute the SQL in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor to create all tables and RLS policies.

4. **Seed exercise library** (optional)

   Run `supabase/seed.sql` in your Supabase SQL editor to populate 60+ common exercises.

5. **Start the app**
   ```bash
   npx expo start
   ```

## Features

### Coach Features
- Dashboard with client overview and quick actions
- Client management (add/remove clients by email)
- Exercise library with 60+ seeded exercises + custom creation
- Drag-and-drop workout builder with set/rep/weight configuration
- Workout templates for reusable workouts
- Assign workouts to clients on specific dates
- Real-time messaging with clients (1-on-1, group, broadcast)
- View client progress and compliance rates
- Habit creation for clients

### Client Features
- Today screen with daily workout and weekly overview
- Calendar view with workout schedule
- Workout execution with set-by-set logging
- Progress dashboard with compliance tracking (7/30/90 day)
- Exercise history and personal records
- Nutrition tracking with macro goals
- Habit tracking
- Milestone badges and achievements
- Real-time messaging with coach

## Project Structure

```
app/                   Expo Router file-based routes
  (auth)/              Auth screens (login, signup, forgot-password, select-role)
  (coach)/             Coach tab screens (dashboard, clients, library, messages, settings)
  (client)/            Client tab screens (today, calendar, messages, progress, settings)
components/            Shared UI components
lib/                   Core utilities
  supabase.ts          Supabase client
  theme.ts             Material Design 3 theming
  auth-provider.tsx    Auth state management
  notifications.ts     Push notification helpers
  milestones.ts        Achievement badge computation
  queries/             React Query hooks per domain
stores/                Zustand state stores
types/                 TypeScript type definitions
supabase/
  migrations/          SQL schema migrations
  seed.sql             Exercise library seed data
```
