<div align="center">

# IntelliPDF

### Production-ready AI PDF chat SaaS — upload, index, and ask with confidence.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-ISC-lightgrey)](#license)

**IntelliPDF turns static PDFs into secure, cited, conversational knowledge bases.** It is a full-stack RAG application that accepts a PDF, indexes it asynchronously, shows live progress, and streams grounded answers with the source passages that informed them.

[Getting started](#quick-start) · [Architecture](#architecture) · [API](#api-highlights) · [Contributing](#contributing)

</div>

---

## Why IntelliPDF

IntelliPDF is designed around the workflow a document-intelligence product needs in practice: keep request handling responsive, move costly indexing into a retryable queue, isolate users' documents at retrieval time, and make each answer auditable with source context. The result is a clean, modular foundation for an AI-powered PDF Chat SaaS.

## Highlights

- **Grounded PDF chat** — answers are generated only from retrieved PDF context; when context is insufficient, the assistant returns `I don't know.`
- **Real-time ingestion** — PDF parsing, chunking, embeddings, and vector indexing run in BullMQ workers while Socket.IO pushes status and progress to the document owner.
- **Streaming UX** — answers arrive token-by-token over Server-Sent Events (SSE), with citations emitted before generation completes.
- **Evidence-first answers** — each assistant message persists matched chunks, relevance scores, and PDF metadata; the UI renders expandable source cards.
- **Secure multi-user foundation** — local credentials, Google OAuth, JWT access tokens, refresh-token sessions in HTTP-only cookies, ownership checks, and role-protected administration routes.
- **Scalable boundaries** — React and Express are separated from PostgreSQL state, Redis-backed jobs, Qdrant vectors, and managed AI providers.
- **Operational safeguards** — request IDs, Helmet, configurable CORS, API/auth rate limiting, structured logging, centralized error handling, graceful shutdown, and job retries.

## Product tour

> Replace these placeholders with product captures when publishing the repository.

| Upload and live indexing | Streaming chat with sources |
| --- | --- |
| `docs/screenshots/upload-and-indexing.png` | `docs/screenshots/cited-chat.png` |
| _Drop in a PDF and watch queued, processing, embedding, and indexing states update live._ | _Follow a streaming answer back to its matched PDF passages and page metadata._ |

## Architecture

```mermaid
flowchart LR
    U["Authenticated user"] --> W["React + Vite web app"]
    W -->|"REST / JWT"| API["Express API"]
    W <-->|"Socket.IO progress"| API
    W <-->|"SSE answer stream"| API

    API --> PG[("PostgreSQL\nusers, sessions, documents, chats")]
    API --> R[("Redis")]
    R --> Q["BullMQ indexing queue"]
    Q --> WK["Worker · concurrency 5"]
    WK --> FS["Local PDF storage"]
    WK --> G["Google Gemini\nembeddings"]
    G --> V[("Qdrant\nvector collection")]

    API --> V
    API --> LLM["Groq · Llama 3.3 70B"]
```

### Clean application boundaries

The server is organized by feature (`auth`, `pdf-chat`, `users`, and `audit`) and by responsibility. Presentation layers define Express routes/controllers; application services coordinate use cases; infrastructure adapters handle Prisma, JWT, BullMQ, local file storage, Google embeddings, and Qdrant. A composition root wires dependencies together. This keeps provider-specific code outside of the core document and chat workflows.

```mermaid
flowchart TB
    P["Presentation\nroutes · controllers · validation"] --> A["Application\nauth · documents · chats · RAG · queue"]
    A --> I["Infrastructure\nPrisma · JWT · Redis/BullMQ · Qdrant · AI providers"]
    I --> X["External systems\nPostgreSQL · Redis · Qdrant · Google · Groq"]
```

## RAG pipeline

IntelliPDF uses a document-scoped retrieval flow so a query is only evaluated against chunks from the active PDF.

```mermaid
sequenceDiagram
    participant User
    participant API as Express API
    participant Worker as BullMQ worker
    participant PDF as PDFLoader
    participant Embed as Gemini embeddings
    participant Qdrant
    participant Groq

    User->>API: Upload PDF (max 50 MB)
    API->>Worker: Enqueue indexing job
    Worker->>PDF: Parse PDF pages
    Worker->>Worker: Split text (1500 chars, 300 overlap)
    Worker->>Embed: Embed batches of 20 chunks
    Embed-->>Worker: Vectors
    Worker->>Qdrant: Store vectors + document metadata
    Worker-->>User: Socket.IO progress → completed
    User->>API: Ask a question
    API->>Embed: Embed contextualized question
    API->>Qdrant: Similarity search, filtered by documentId
    Qdrant-->>API: Top 6 chunks (score threshold ≥ 0.5)
    API->>Groq: Context + chat history + question
    Groq-->>User: SSE chunks and cited sources
```

### Retrieval and answer quality

1. LangChain's `PDFLoader` extracts PDF pages.
2. `RecursiveCharacterTextSplitter` creates overlapping, retrieval-friendly chunks.
3. `gemini-embedding-001` generates vectors that are stored in Qdrant's `pdf_documents` collection with a `documentId` metadata filter.
4. For follow-up questions, the LLM first rewrites the query into a standalone question using the chat history.
5. The six best matches are filtered at a `0.5` similarity threshold and supplied as context to Groq's `llama-3.3-70b-versatile` model.
6. The answer prompt prohibits outside knowledge and records the retrieved chunks as citations on the saved assistant message.

## Real-time indexing workflow

Uploads return immediately with a `QUEUED` document record. A Redis-backed BullMQ job then transitions the document through `PROCESSING`, `EMBEDDING`, `INDEXING`, `COMPLETED`, or `FAILED`. Jobs run with concurrency `5`, retry up to three times using exponential backoff, and retain failed jobs for inspection. The worker writes every state transition to PostgreSQL and emits a private `document_progress` Socket.IO event to the owning user's room.

This separation lets the API remain available while expensive parsing and embedding work happens off the request path. Redis, the worker, and Qdrant can be deployed as independently scaled services as workload grows.

## Authentication and authorization

- Local sign-up/login with bcrypt password hashing
- Google OAuth authorization-code login
- Short-lived bearer access tokens plus rotating refresh-token sessions
- Refresh tokens are stored in `httpOnly` cookies and hashed before persistence
- JWT-authenticated Socket.IO connections join private per-user rooms
- Document and chat ownership is enforced before read, delete, or message operations
- Role-based access: `ADMIN` and `MANAGER` can list users; `ADMIN` can view login audit logs
- Auth endpoints use a stricter 10-attempt/15-minute limiter; API limits are environment-configurable

## Streaming responses and citations

`POST /api/v1/pdf-chat/chats/:id/messages` is an SSE endpoint. The service saves the user's message, emits citations immediately, then forwards model output as `chunk` events. Once the stream completes, it persists the full assistant response and citation JSON. The React client uses native `fetch` streaming to render the answer incrementally and an accordion UI to show matched passage previews, scores, and page/location metadata.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Web client | React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form, Zod |
| API | Node.js, Express 5, TypeScript, Zod, Multer, Socket.IO, Winston, Morgan |
| AI / RAG | LangChain, Google Gemini embeddings (`gemini-embedding-001`), Groq (`llama-3.3-70b-versatile`), Qdrant |
| Data and jobs | PostgreSQL 17, Prisma, Redis 7, BullMQ |
| Security | bcrypt, JWT, HTTP-only cookies, Helmet, CORS, express-rate-limit |
| Local platform | Docker Compose, pnpm |

## Project structure

```text
.
├── client/                         # React dashboard and PDF chat experience
│   └── src/
│       ├── app/                    # routing, layouts, providers
│       ├── features/auth/           # local + Google authentication
│       ├── features/dashboard/      # dashboard and admin views
│       ├── features/pdf-chat/       # documents, chat, SSE client, citations
│       └── shared/                  # API client, hooks, Socket.IO provider, UI
├── server/                         # Express + TypeScript application
│   ├── prisma/                      # PostgreSQL schema and migrations
│   └── src/
│       ├── app/                     # Express bootstrap and route composition
│       ├── common/                  # middleware, errors, database, helpers
│       ├── config/                  # validated environment and logging
│       ├── modules/
│       │   ├── auth/                # credentials, OAuth, JWT, sessions
│       │   ├── pdf-chat/            # ingestion, queue, RAG, streaming chat
│       │   ├── users/               # role-protected user administration
│       │   └── audit/               # login audit log access
│       └── container.ts             # dependency composition root
├── docker-compose.dev.yml           # client, server, Postgres, Redis, Qdrant
└── README.md
```

## Quick start

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker and Docker Compose (recommended for PostgreSQL, Redis, and Qdrant)
- A [Google AI API key](https://aistudio.google.com/app/apikey) for embeddings
- A [Groq API key](https://console.groq.com/keys) for answer generation
- Google OAuth client credentials (required by the server's environment validation)

### Docker development stack

1. Create local environment files.

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

2. Update `server/.env` with real secrets. When using Compose, keep the service hostnames below.

   ```dotenv
   DATABASE_URL=postgresql://admin:admin@postgres:5432/demo?schema=public
   QDRANT_URL=http://qdrant:6333
   REDIS_URL=redis://redis:6379
   GROQ_API_KEY=your_groq_api_key
   GOOGLE_API_KEY=your_google_ai_api_key
   JWT_ACCESS_SECRET=replace_with_a_long_random_value
   JWT_REFRESH_SECRET=replace_with_a_different_long_random_value
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ORIGIN=http://localhost:5173
   ```

3. Point the client to the API.

   ```dotenv
   VITE_API_URL=http://localhost:4000/api/v1
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. Start services and run the existing database migrations.

   ```bash
   docker compose -f docker-compose.dev.yml up --build -d
   docker compose -f docker-compose.dev.yml exec server pnpm exec prisma migrate deploy
   ```

5. Open [http://localhost:5173](http://localhost:5173). The API health check is at [http://localhost:4000/health](http://localhost:4000/health).

### Local development

Start PostgreSQL, Redis, and Qdrant (the Compose file can run only these services), then use host-accessible URLs in `server/.env`:

```dotenv
DATABASE_URL=postgresql://admin:admin@localhost:5432/demo?schema=public
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379
```

Install and run each application in a separate terminal:

```bash
cd server
pnpm install
cp .env.example .env
pnpm exec prisma migrate dev
pnpm dev
```

```bash
cd client
pnpm install
cp .env.example .env
pnpm dev
```

## Docker support

`docker-compose.dev.yml` provisions the Vite client, Express server, PostgreSQL, Redis, and Qdrant with persistent named volumes for Redis and Qdrant. The development images use Node 20 Alpine and bind-mount each application source directory for live reload.

```bash
# Start only stateful dependencies for local app development
docker compose -f docker-compose.dev.yml up -d postgres redis qdrant

# Watch logs for the full stack
docker compose -f docker-compose.dev.yml logs -f server client

# Stop the stack (preserves named volumes)
docker compose -f docker-compose.dev.yml down
```

## Environment variables

### Server — `server/.env`

| Variable | Required | Description |
| --- | :---: | --- |
| `PORT` | No | API port; example defaults to `4000`. |
| `NODE_ENV` | No | `development`, `production`, or `test`. |
| `DATABASE_URL` | Yes | PostgreSQL Prisma connection string. |
| `ORIGIN` | Yes | Comma-separated allowed browser origins. |
| `JWT_ACCESS_SECRET` | Yes | Access-token signing secret. |
| `JWT_REFRESH_SECRET` | Yes | Refresh-token signing secret. |
| `GROQ_API_KEY` | Yes | Groq key used for answer generation. |
| `GOOGLE_API_KEY` | Yes | Google AI key used for document/query embeddings. |
| `QDRANT_URL` | No | Qdrant endpoint; defaults to `http://qdrant:6333`. |
| `REDIS_URL` | No | Redis endpoint; defaults to `redis://redis:6379`. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. |
| `RATE_LIMIT_WINDOW_MS` | No | General API rate-limit window; default 15 minutes. |
| `RATE_LIMIT_MAX` | No | General API requests allowed in that window; default 100. |

### Client — `client/.env`

| Variable | Required | Description |
| --- | :---: | --- |
| `VITE_API_URL` | Yes | API v1 base URL, e.g. `http://localhost:4000/api/v1`. |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID used by the browser sign-in provider. |

Never commit environment files, OAuth credentials, JWT secrets, API keys, or uploaded PDFs. The repository's `.gitignore` already covers these local artifacts.

## API highlights

All application routes are namespaced under `/api/v1`. PDF chat routes require `Authorization: Bearer <access-token>`; upload uses `multipart/form-data` with the `file` field.

| Area | Endpoint | Purpose |
| --- | --- | --- |
| Health | `GET /health` | Liveness check. |
| Auth | `POST /auth/local-signup` | Register a local account. |
| Auth | `POST /auth/local-login` | Sign in and receive an access token plus refresh cookie. |
| Auth | `POST /auth/google-login` | Exchange a Google authorization code for a session. |
| Auth | `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout` | Manage a session. |
| Documents | `POST /pdf-chat/documents` | Upload a PDF and enqueue indexing. |
| Documents | `GET /pdf-chat/documents`, `DELETE /pdf-chat/documents/:id` | List or remove owned PDFs. |
| Chats | `POST /pdf-chat/chats`, `GET /pdf-chat/chats`, `DELETE /pdf-chat/chats/:id` | Create, list, or remove chats. |
| Messages | `GET /pdf-chat/chats/:id/messages` | Read persisted conversation history. |
| Messages | `POST /pdf-chat/chats/:id/messages` | Receive SSE `user_message`, `citations`, `chunk`, `done`, or `error` events. |
| Admin | `GET /users`, `GET /audit/login-logs` | Role-protected user and audit visibility. |

## Useful commands

```bash
# Server
cd server
pnpm dev             # Run API + indexing worker in watch mode
pnpm build           # Compile TypeScript
pnpm seed:user       # Create the configured seed user

# Client
cd client
pnpm dev             # Start Vite
pnpm build           # Type-check and create a production build
pnpm lint            # Run ESLint
pnpm typecheck       # Run TypeScript checks
```

## Roadmap

- [ ] Add a production Compose profile with immutable images and environment-specific configuration.
- [ ] Move uploaded source files to object storage and add signed-download controls.
- [ ] Add document collection/workspace sharing and organization-level RBAC.
- [ ] Support additional file types, OCR, and configurable chunking/retrieval settings.
- [ ] Add observability dashboards, queue metrics, tracing, and automated test coverage.
- [ ] Introduce CI checks, release automation, and deployment guides.

## Contributing

Contributions are welcome. Please keep changes focused, respect the feature-oriented architecture, and avoid committing secrets or generated runtime data.

1. Fork the repository and create a focused branch (for example, `feat/document-export`).
2. Install dependencies in the changed package(s) with pnpm and configure local environment files from the examples.
3. Run the relevant checks: `pnpm typecheck`, `pnpm lint`, and `pnpm build` in `client`; `pnpm build` in `server`.
4. Include migrations when schema changes require them, and describe any provider/environment changes in your pull request.

## License

The server package declares the [ISC license](https://opensource.org/license/isc-license-txt). A repository-wide `LICENSE` file has not yet been added; add one before distributing the project under a final open-source license.

---

<div align="center">
Built with React, Express, LangChain, Qdrant, Redis, PostgreSQL, Google Gemini, and Groq.
</div>
