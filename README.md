# Frontend AI — Build website frontends with chat

An AI chatbot that generates website frontends from natural language. Describe what you want, get HTML/CSS/JS. Built with **Next.js**, **Gemini API**, and **Neon** (Postgres).

## Setup

### 1. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 2. Gemini API key

1. Get a key: [Google AI Studio](https://aistudio.google.com/apikey)
2. Copy `.env.example` to `.env`
3. Set `GEMINI_API_KEY=your_key` in `.env`

Without this, the chat API will return an error.

### 3. Neon database (optional)

Chat history is saved when a Neon database is connected.

1. Create a project at [Neon](https://neon.tech) and get two connection strings:
   - **Pooled** (for the app): `postgresql://...@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
   - **Direct** (for migrations): `postgresql://...@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

2. In `.env`:

   ```env
   DATABASE_URL="postgresql://...pooler...?sslmode=require"
   DIRECT_URL="postgresql://... (no pooler) ...?sslmode=require"
   ```

3. Run migrations:

   ```bash
   npx prisma migrate deploy
   ```

If you skip Neon, the app still works; chat just won’t be persisted.

## Tech stack

- **Next.js 16** (App Router)
- **Gemini 2.0 Flash** via `@google/genai`
- **Neon** Postgres with **Prisma 7** (driver adapter `@prisma/adapter-pg`)

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npx prisma migrate deploy` — apply migrations (after setting Neon URLs)
- `npx prisma generate` — regenerate Prisma client
