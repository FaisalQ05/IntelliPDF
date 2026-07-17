<div align="center">

# IntelliPDF

**Ask better questions of your PDFs.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

IntelliPDF is a full-stack RAG application for uploading PDFs and chatting with their contents. Documents are indexed in the background, answers stream into the UI, and every response can include the source passages used to generate it.

[Quick start](#quick-start) · [Architecture](#architecture) · [API](#api) · [Contributing](#contributing)

</div>

## Demo

![IntelliPDF demo — upload a document, wait for indexing, then chat with cited answers](screenshots/demo.gif)

## What it does

- Upload PDFs up to 50 MB and track indexing progress in real time.
- Parse and split documents, generate Gemini embeddings, and store vectors in Qdrant.
- Ask follow-up questions with conversation-aware retrieval.
- Stream Groq responses over Server-Sent Events.
- Review source snippets, page metadata, and similarity scores alongside an answer.
- Sign in with email/password or Google OAuth; sessions use access tokens and HTTP-only refresh cookies.
- Keep document and chat data isolated by user, with role-protected user and audit endpoints.

## Screenshots

| Upload and indexing | Cited PDF chat |
| --- | --- |
| ![IntelliPDF document upload and live embedding progress](screenshots/upload-and-indexing.png) | ![IntelliPDF answer with source citations](screenshots/cited-chat.png) |
| Upload a PDF and see the current processing stage and progress. | Stream an answer and expand the retrieved source passages behind it. |

## Architecture

```mermaid
flowchart LR
    Client["React client"] -->|"REST + JWT"| API["Express API"]
    Client <-->|"Socket.IO progress"| API
    Client <-->|"SSE response stream"| API

    API --> DB[("PostgreSQL")]
    API --> Redis[("Redis")]
    Redis --> Queue["BullMQ queue"]
    Queue --> Worker["Indexing worker"]
    Worker --> Storage["Local PDF storage"]
    Worker --> Gemini["Gemini embeddings"]
    Gemini --> Qdrant[("Qdrant")]

    API --> Qdrant
    API --> Groq["Groq LLM"]
```

The server is split into feature modules (`auth`, `pdf-chat`, `users`, and `audit`). Each module keeps its routes and controllers separate from application services and infrastructure adapters. Prisma, BullMQ, Qdrant, JWT, file storage, and AI providers are wired through a small composition root in `server/src/container.ts`.

## How a document becomes a conversation

```mermaid
sequenceDiagram
    participant U as User
    participant A as API
    participant W as BullMQ worker
    participant E as Gemini
    participant Q as Qdrant
    participant L as Groq

    U->>A: Upload PDF
    A->>W: Queue indexing job
    W->>W: Parse PDF and split text
    W->>E: Embed chunks in batches
    E-->>W: Vectors
    W->>Q: Store vectors and document metadata
    W-->>U: Socket.IO indexing updates
    U->>A: Send question
    A->>E: Embed contextualized question
    A->>Q: Search active document only
    Q-->>A: Relevant chunks
    A->>L: Context, history, and question
    L-->>U: SSE answer chunks + citations
```

### RAG details

- PDFs are loaded with LangChain's `PDFLoader`.
- `RecursiveCharacterTextSplitter` creates 1,500-character chunks with 300 characters of overlap.
- Embeddings use `gemini-embedding-001`; vectors are stored in Qdrant's `pdf_documents` collection.
- Retrieval returns up to six chunks, filters scores below `0.5`, and always filters by `documentId`.
- Follow-up questions are rewritten into standalone questions before retrieval.
- The answer prompt is restricted to retrieved context. If the context does not contain the answer, the model replies: `I don't know.`

## Indexing, streaming, and citations

Uploads return immediately and are processed by a Redis-backed BullMQ worker. Documents move through `QUEUED`, `PROCESSING`, `EMBEDDING`, `INDEXING`, `COMPLETED`, or `FAILED`; progress is stored in PostgreSQL and broadcast to the owner over Socket.IO. The queue runs with concurrency 5, retries jobs three times with exponential backoff, and retains failed jobs for inspection.

Chat replies use Server-Sent Events. The API saves the user message, sends citations first, then relays response chunks as they arrive from the model. When streaming ends, the complete assistant response and its citation data are saved with the chat. The UI shows citation count, source preview, page/location metadata, and match score.

## Authentication and access control

- Email/password sign-up and login with bcrypt password hashing
- Google OAuth authorization-code login
- JWT bearer access tokens and persisted, hashed refresh-token sessions
- HTTP-only refresh cookie; `secure` and `sameSite=strict` in production
- Authenticated Socket.IO connections are assigned to private user rooms
- Ownership checks before a user can read, delete, or chat with a document
- `ADMIN` can access login logs; `ADMIN` and `MANAGER` can list users
- Helmet, configurable CORS, request IDs, and separate API/auth rate limits

## Stack

| Area | Tools |
| --- | --- |
| Client | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, Socket.IO Client |
| Server | Node.js, Express 5, TypeScript, Prisma, Zod, Multer, Socket.IO |
| AI | LangChain, Google Gemini embeddings, Groq `llama-3.3-70b-versatile`, Qdrant |
| Data & jobs | PostgreSQL 17, Redis 7, BullMQ |
| Dev environment | pnpm, Docker Compose |

## Project structure

```text
client/
  src/app/                    # routes, layouts, providers
  src/features/auth/          # local and Google authentication
  src/features/dashboard/     # dashboard and admin screens
  src/features/pdf-chat/      # upload, chat, streaming, citations
  src/shared/                 # API client, UI helpers, Socket.IO provider
server/
  prisma/                     # schema and migrations
  src/common/                 # middleware, errors, database helpers
  src/modules/auth/           # sessions, JWT, OAuth
  src/modules/pdf-chat/       # documents, queue, RAG, streaming chat
  src/modules/users/          # user administration
  src/modules/audit/          # login audit logs
  src/container.ts            # dependency composition
screenshots/                  # README product screenshots
docker-compose.dev.yml        # local development stack
```

## Quick start

### Requirements

- Node.js 20+
- pnpm 10+
- Docker and Docker Compose
- A [Google AI API key](https://aistudio.google.com/app/apikey) for embeddings
- A [Groq API key](https://console.groq.com/keys) for chat generation
- Google OAuth client credentials

### Run with Docker

1. Create the environment files.

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

2. Set the required values.

   ```dotenv
   # server/.env
   DATABASE_URL=postgresql://admin:admin@postgres:5432/demo?schema=public
   QDRANT_URL=http://qdrant:6333
   REDIS_URL=redis://redis:6379
   ORIGIN=http://localhost:5173
   JWT_ACCESS_SECRET=replace_with_a_long_random_value
   JWT_REFRESH_SECRET=replace_with_a_different_long_random_value
   GOOGLE_API_KEY=your_google_ai_api_key
   GROQ_API_KEY=your_groq_api_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

   ```dotenv
   # client/.env
   VITE_API_URL=http://localhost:4000/api/v1
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

3. Start the stack and apply migrations.

   ```bash
   docker compose -f docker-compose.dev.yml up --build -d
   docker compose -f docker-compose.dev.yml exec server pnpm exec prisma migrate deploy
   ```

4. Open [http://localhost:5173](http://localhost:5173). The health check is available at [http://localhost:4000/health](http://localhost:4000/health).

### Run locally

Start PostgreSQL, Redis, and Qdrant, then use localhost URLs in `server/.env`:

```dotenv
DATABASE_URL=postgresql://admin:admin@localhost:5432/demo?schema=public
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379
```

In separate terminals:

```bash
cd server
pnpm install
pnpm exec prisma migrate dev
pnpm dev
```

```bash
cd client
pnpm install
pnpm dev
```

## Environment variables

| Variable | Location | Purpose |
| --- | --- | --- |
| `PORT`, `NODE_ENV` | Server | API port and runtime environment. |
| `DATABASE_URL` | Server | PostgreSQL connection string. |
| `ORIGIN` | Server | Comma-separated CORS allowlist. |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Server | Access and refresh token secrets. |
| `GOOGLE_API_KEY` | Server | Gemini embedding API key. |
| `GROQ_API_KEY` | Server | Groq chat API key. |
| `QDRANT_URL`, `REDIS_URL` | Server | Vector database and job-queue connections. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Server | Google OAuth credentials. |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | Server | General API rate-limit settings. |
| `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID` | Client | API base URL and browser OAuth client ID. |

Do not commit `.env` files, API keys, OAuth secrets, JWT secrets, or uploaded documents.

## API

Routes are prefixed with `/api/v1` unless noted otherwise. PDF chat routes require `Authorization: Bearer <access-token>`. Uploads use `multipart/form-data` with a `file` field.

| Endpoint | Description |
| --- | --- |
| `GET /health` | Service health check. |
| `POST /auth/local-signup` | Create an account. |
| `POST /auth/local-login` | Sign in and set a refresh-token cookie. |
| `POST /auth/google-login` | Sign in with a Google authorization code. |
| `POST /auth/refresh` · `GET /auth/me` · `POST /auth/logout` | Session management. |
| `POST /pdf-chat/documents` | Upload and queue a PDF for indexing. |
| `GET /pdf-chat/documents` · `DELETE /pdf-chat/documents/:id` | Manage documents. |
| `POST /pdf-chat/chats` · `GET /pdf-chat/chats` · `DELETE /pdf-chat/chats/:id` | Manage chats. |
| `GET /pdf-chat/chats/:id/messages` | Read message history. |
| `POST /pdf-chat/chats/:id/messages` | Stream `user_message`, `citations`, `chunk`, `done`, and `error` SSE events. |
| `GET /users` · `GET /audit/login-logs` | Role-protected administration routes. |

## Commands

```bash
# Server
cd server
pnpm dev
pnpm build
pnpm seed:user

# Client
cd client
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

## Roadmap

- Object storage for uploaded documents
- Workspace sharing and organization-level roles
- OCR and support for additional document formats
- Queue metrics, tracing, automated tests, and CI
- Production deployment configuration

## Contributing

Contributions are welcome. Please create a focused branch, keep the feature/module boundaries intact, and include migrations when changing the Prisma schema. Before opening a pull request, run the relevant checks:

```bash
cd client && pnpm lint && pnpm typecheck && pnpm build
cd server && pnpm build
```

## License

The server package is currently declared as ISC. Add a repository-level `LICENSE` file before distributing IntelliPDF under a final open-source license.
