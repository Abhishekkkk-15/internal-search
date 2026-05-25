# Nexus Assistant (Internal Search Monorepo)

Nexus Assistant is an AI-powered internal search and chat platform designed to aggregate and index data across an organization's various third-party platforms (Slack, Notion, GitHub, Google Drive, Jira). By leveraging Retrieval-Augmented Generation (RAG) and vector search, it allows users to chat with their company's collective knowledge base.

This is a full-stack monorepo built with [Turborepo](https://turbo.build/) and [pnpm](https://pnpm.io/).

## 🚀 Key Features

- **Multi-Source Integrations**: Connect and sync data from Slack, Notion, GitHub, Google Drive, and Jira.
- **Vector Search (RAG)**: Automatically chunks and embeds documents into a PostgreSQL database utilizing the `pgvector` extension for semantic search.
- **AI Chat Assistant**: A conversational interface that answers queries based on your organization's synced documents, complete with source citations.
- **Background Syncing**: Uses BullMQ and Redis to handle robust, scheduled syncing from connected data sources.
- **Multi-tenant Architecture**: Support for distinct organizations, role-based access control, and segregated data.

## 🏗 Architecture Overview

The project is structured into `apps` and `packages` to promote modularity.

### Apps

- **`web`**: A Next.js (App Router) web application. 
  - **Responsibilities**: User authentication (NextAuth), chat interface, search dashboard, connection management, and organization settings.
  - **Tech**: React Query, Zustand, Tailwind CSS, Framer Motion.
- **`api`**: An Express.js backend server.
  - **Responsibilities**: Core RAG logic, embedding generation, background worker queues (syncing data sources), and API endpoints.
  - **Tech**: LangChain, OpenAI, BullMQ, Redis.

### Packages (Shared)

- **`@nexus/database`**: Prisma ORM schema and client, defining models like `Organization`, `User`, `Connection`, `Document` (with vector embeddings), and `Conversation`.
- **`@nexus/ai`**: Core AI logic containing RAG pipelines, prompt definitions, embedding utilities, and LangChain integration.
- **`@nexus/ui`**: Shared React components.
- **`@nexus/types`**: Shared TypeScript types for API payloads and frontend.
- **`@nexus/eslint-config` & `@nexus/typescript-config`**: Shared code quality rules.

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Node.js, Express.js
- **AI/ML**: OpenAI (gpt-4, embeddings), LangChain
- **Database**: PostgreSQL (with `pgvector`), Prisma
- **Queue/Cache**: Redis, BullMQ
- **Tooling**: Turborepo, pnpm, TypeScript

## 📦 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- pnpm (v10+)
- PostgreSQL database (with `pgvector` extension enabled)
- Redis instance (for BullMQ job processing)
- OpenAI API Key

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
   - Copy `.env.example` to `.env` in both `apps/web` and `apps/api`.
   - Provide your `DATABASE_URL` (Postgres), Redis connection string, and `OPENAI_API_KEY`.

4. Apply database migrations:
   ```bash
   cd packages/database
   pnpm prisma db push
   # or pnpm prisma migrate dev
   ```

### Running the Project

Start the entire stack (Next.js web app and Express API) concurrently:

```bash
pnpm run dev
```

### Build and Lint

- **Build everything**: `pnpm run build`
- **Lint everything**: `pnpm run lint`

## 🗄️ Database Schema Highlight

The core of the vector search relies on the `Document` model in Prisma:

```prisma
model Document {
  id             String   @id @default(cuid())
  organizationId String
  title          String
  content        String   @db.Text
  source         String   // slack, notion, github, drive, jira
  // ...
  embedding      Unsupported("vector(4096)")? // pgvector integration
}
```
