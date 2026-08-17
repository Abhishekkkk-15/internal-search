# Nexus Assistant (Internal Search Monorepo)

Nexus Assistant is an AI-powered internal search and chat platform designed to aggregate and index data across an organization's primary developer and workspace platforms (**Slack, Notion, GitHub**). By leveraging Retrieval-Augmented Generation (RAG) and vector search, it allows users to chat with their personal and team knowledge base.

This is a full-stack monorepo built with [Turborepo](https://turbo.build/) and [pnpm](https://pnpm.io/).

---

## 🚀 Key Features

- **User-Level Multi-Source Integrations**: Connect and sync data directly for your user account from **Slack**, **Notion**, and **GitHub** (Issues & Pull Requests).
- **Hybrid Vector & Keyword Search**: Automatically embeds documents into PostgreSQL utilizing the `pgvector` extension for semantic search, combined with PostgreSQL `tsvector` full-text search via **Reciprocal Rank Fusion (RRF)**.
- **40% (0.4) Similarity Threshold**: Filters out irrelevant search results below 40% cosine vector similarity score prior to LLM response generation and UI rendering.
- **AI Chat Assistant**: Conversational interface powered by NVIDIA NIM AI models that answers queries based on your synced documents, complete with interactive source citation badges (`[Source 1 - NOTION]`) and clickable URL links.
- **Background Syncing & Cron Scheduling**: Uses BullMQ and Redis to handle robust, scheduled syncing (`15m`, `1h`, `24h`, `manual`).

---

## 🏗 Architecture Overview

The project is structured into `apps` and `packages` to promote modularity.

### Apps

- **`web`**: A Next.js 15 (App Router) web application. 
  - **Responsibilities**: User authentication (NextAuth), interactive chat interface, hybrid search dashboard, integration connections management, and user settings.
  - **Tech**: React Query, Zustand, Tailwind CSS, Framer Motion.
- **`api`**: An Express.js backend server.
  - **Responsibilities**: Core RAG logic, embedding generation, background worker queues (syncing data sources via BullMQ), and API endpoints.
  - **Tech**: LangChain, NVIDIA NIM, BullMQ, Redis.

### Packages (Shared)

- **`@nexus/database`**: Prisma ORM schema and client, defining models like `User`, `Connection`, `Document` (with 4096-dim vector embeddings), `Conversation`, and `Message`.
- **`@nexus/ai`**: Core AI logic containing NVIDIA NIM RAG pipelines, prompt definitions, embedding utilities (`embeddingService`), and LangChain integration.
- **`@nexus/ui`**: Shared React components (SourceSelector, MessageBubble with citation parser, SearchBar, ActionResultCard).
- **`@nexus/types`**: Shared TypeScript types for API payloads and frontend interfaces.
- **`@nexus/eslint-config` & `@nexus/typescript-config`**: Shared code quality rules.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Node.js, Express.js
- **AI/ML**: NVIDIA NIM API (`nv-embed-v1`, `meta/llama-3.3-70b-instruct`), LangChain
- **Database**: PostgreSQL (Aiven Cloud with `pgvector`), Prisma
- **Queue/Cache**: Redis, BullMQ
- **Tooling**: Turborepo, pnpm, TypeScript

---

## 📦 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- pnpm (v10+)
- PostgreSQL database (Aiven Cloud or local Postgres with `pgvector` extension enabled)
- Redis instance (for BullMQ job processing)
- NVIDIA API Key (`INVDIA_API_KEY`)

### Installation

1. Clone the repository and navigate to the root directory:
   ```bash
   cd internal-search
   ```

2. Install the workspace dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables:
   - Provide `DATABASE_URL` (Postgres with `?sslmode=no-verify`), Redis connection string, and `INVDIA_API_KEY` in `.env` files across `apps/web`, `apps/api`, and `packages/database`.

4. Apply database schema:
   ```bash
   pnpm --filter @nexus/database run push
   ```

### Running the Project

Start the entire stack (Next.js web app on `http://localhost:3000` and Express API on `http://localhost:3002`):

```bash
pnpm run dev
```

### Build and Typecheck

- **Build everything**: `pnpm run build`
- **Typecheck everything**: `pnpm --filter web exec tsc --noEmit` and `pnpm --filter api exec tsc -b`

---


