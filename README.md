# Aiden — AI-Powered Product Management Assistant

> **Last updated:** 2026-03-05  
> Turn messy product information into structured, actionable outputs. Upload documents, ask questions, and generate PRDs, user stories, roadmaps, and more — all grounded in your real data.

---

## Table of Contents

- [Product Overview](#product-overview)
- [Why Aiden](#why-aiden)
- [Key Features](#key-features)
- [UI Overview](#ui-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Backend Functions](#backend-functions)
- [Database Schema](#database-schema)
- [RAG Pipeline](#rag-pipeline)
- [Document Relevance Guard](#document-relevance-guard)
- [Supported Artifact Types](#supported-artifact-types)
- [Setup and Configuration](#setup-and-configuration)
- [Environment Variables](#environment-variables)
- [Security Notes](#security-notes)
- [Limitations and Future Roadmap](#limitations-and-future-roadmap)

---

## Product Overview

**Aiden** is an AI assistant built specifically for **Product Managers**. It helps PMs transform raw product documents like PRDs, customer feedback, research notes, and meeting transcripts into structured deliverables like user stories, roadmaps, metrics plans, and stakeholder updates.

Unlike generic AI chatbots, Aiden is:

- **Domain-specific** — trained with PM-centric system prompts and output formatting
- **Document-grounded** — every response is backed by your actual uploaded data via RAG (Retrieval-Augmented Generation)
- **Guard-railed** — automatically rejects non-product documents (resumes, personal files) to maintain focus

---

## Why Aiden

| Problem | Aiden Solution |
|---|---|
| PMs spend hours manually writing PRDs, user stories, and roadmaps | One-click artifact generation from uploaded documents |
| AI chatbots hallucinate or give generic answers | RAG pipeline grounds every answer in the users actual documents |
| Teams waste time on documents that are not product-related | Automated relevance guard rejects non-PM content before the AI runs |
| No feedback loop on AI quality | Built-in thumbs up/down feedback with analytics dashboard |

---

## Key Features

### 1. Document Intelligence

Upload PDF, DOCX, TXT, MD, or CSV files (up to 10MB each, max 2 documents per session). Aiden extracts text, chunks it, generates vector embeddings, and indexes everything for semantic search.

### 2. RAG-Powered Chat

Every response is grounded in your uploaded documents. The system retrieves the most relevant chunks using vector similarity search before generating a response, eliminating hallucinations.

### 3. One-Click Artifact Generation

Generate structured PM deliverables with a single click:

- **PRD** — Full product requirements document
- **User Stories** — Tabular epics, stories, acceptance criteria, and priorities
- **Roadmap** — Now / Next / Later initiative planning
- **Metrics Plan** — KPIs, measurement methods, and success targets
- **Stakeholder Update** — Email-formatted weekly status updates

### 4. Document Relevance Guard

A two-layer guard (filename check plus content analysis) automatically rejects non-product documents like resumes or personal files, keeping the assistant focused on PM work.

### 5. Feedback and Analytics

Every AI response has thumbs up/down buttons. Feedback is stored and surfaced in a dedicated analytics dashboard with:

- Satisfaction rate visualization
- Daily feedback trends (last 14 days)
- Recent negative feedback drill-down
- Negative feedback is fed back into the AI to improve future responses

### 6. Streaming Responses

Real-time SSE (Server-Sent Events) streaming for instant, token-by-token response rendering. Users can stop generation at any time.

---

## UI Overview

### Landing Page (/)

A clean hero section introducing Aiden with feature cards highlighting Document Intelligence, Artifact Generation, Roadmap Insights, and RAG-Powered capabilities. A prominent Get Started CTA navigates to the app.

### Main App (/app)

A three-column layout:

- **Left Sidebar** — Artifact generation buttons (PRD, User Stories, Roadmap, Metrics, Stakeholder Update) plus document upload area with drag-and-drop, file status indicators (uploading then indexing then indexed), and remove buttons
- **Center Panel** — Chat interface with suggested prompts when empty, streamed AI responses with rich markdown rendering (tables, code blocks, email wrappers), and per-message feedback buttons
- **Top Bar** — Sidebar toggle, Chat label, and link to Analytics

### Analytics Page (/analytics)

Dashboard showing total ratings, helpful vs not helpful percentages, a satisfaction bar chart, daily feedback trends, and a list of recent negative feedback with the original queries.

### Design System

- Dark-first theme with semantic design tokens
- Framer Motion animations throughout
- Custom markdown rendering with styled tables, blockquotes, and email wrappers for stakeholder updates
- Responsive sidebar with animated open/close

---

## Architecture

```
Frontend (React)

  Landing Page --- Dashboard --- Analytics
                      |
              Sidebar | ChatPanel | ArtifactPanel
              (Docs)  (Messages)  (Generators)
                |         |
                |     streamChat.ts
                |         |
          DocumentContext
          (Upload + Embed)
                |           |
                v           v
        embed-document    chat         (Edge Functions)
        (Deno)            (Deno)
                            |
        - Chunk text      - Relevance guard
        - OpenAI          - RAG retrieval
          embeddings      - Feedback context
        - Store in DB     - AI gateway (streaming)
                |           |
                v           v
          PostgreSQL (pgvector)
          - document_chunks (embeddings)
          - chat_feedback
          - match_document_chunks() (RPC)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| State | React Context (DocumentContext), TanStack Query |
| Routing | React Router v6 |
| Markdown | react-markdown, remark-gfm, rehype-raw |
| File Parsing | pdfjs-dist (PDF), mammoth (DOCX) |
| Backend | Supabase Edge Functions (Deno) |
| Database | PostgreSQL with pgvector extension |
| Embeddings | OpenAI text-embedding-3-small |
| AI Model | Google Gemini 3 Flash Preview (via AI Gateway) |
| Streaming | Server-Sent Events (SSE) |

---

## Project Structure

```
src/
  App.tsx                    -- Router setup
  pages/
    Index.tsx                -- Landing page
    Dashboard.tsx            -- Main app layout
    Analytics.tsx            -- Feedback analytics
    NotFound.tsx             -- 404 page
  components/
    ChatPanel.tsx            -- Chat UI with streaming
    ArtifactPanel.tsx        -- Artifact generation buttons
    ArtifactMarkdown.tsx     -- Rich markdown and email renderer
    DocumentSidebar.tsx      -- File upload and management
    MessageFeedback.tsx      -- Thumbs up/down component
    ui/                      -- shadcn/ui components
  context/
    DocumentContext.tsx      -- Document state and embedding orchestration
  lib/
    streamChat.ts            -- SSE streaming client
    pdfExtractor.ts          -- PDF text extraction
    docxExtractor.ts         -- DOCX text extraction
  integrations/
    supabase/
      client.ts              -- Auto-generated Supabase client
      types.ts               -- Auto-generated DB types

supabase/
  config.toml                -- Supabase configuration
  functions/
    chat/index.ts            -- Chat edge function (RAG and AI)
    embed-document/index.ts  -- Document embedding edge function
```

---

## Backend Functions

### embed-document

Handles document indexing:

1. Receives extracted text, document name, and session ID
2. Chunks text into approximately 1500-character segments with 200-char overlap (smart splitting on paragraph/sentence boundaries)
3. Generates vector embeddings via OpenAI text-embedding-3-small (batched, with retry logic)
4. Deletes any existing chunks for the same document and session
5. Stores chunks and embeddings in document_chunks table

### chat

Handles AI conversations:

1. **Relevance Guard** — Checks the latest uploaded document against a classifier (filename cues plus content keyword analysis). Rejects non-PM documents immediately.
2. **RAG Retrieval** — Generates query embedding, runs match_document_chunks RPC for vector similarity search, scoped to the active (latest) document. Falls back to direct chunk retrieval if semantic search yields no results.
3. **Feedback Context** — Fetches recent negative feedback for the session and injects it as a system message to avoid repeating unhelpful patterns.
4. **Sanitization** — Filters out previous not-product-related warning messages from conversation history to prevent the AI from echoing them.
5. **AI Generation** — Sends the enriched message array to Google Gemini 3 Flash via the AI Gateway with SSE streaming.

---

## Database Schema

### document_chunks

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| session_id | text | Groups chunks by user session |
| document_name | text | Original filename |
| chunk_index | integer | Order within document |
| content | text | Chunk text content |
| embedding | vector(1536) | OpenAI embedding vector |
| created_at | timestamptz | Auto-generated |

### chat_feedback

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| session_id | text | Links feedback to session |
| message_content | text | AI response (truncated to 2000 chars) |
| user_query | text (nullable) | User original question |
| rating | text | up or down |
| created_at | timestamptz | Auto-generated |

### match_document_chunks (RPC Function)

PostgreSQL function that performs vector similarity search using cosine distance against the pgvector extension. Accepts query embedding, session ID, match count, and similarity threshold.

---

## RAG Pipeline

```
User Query
    |
    v
Generate query embedding (OpenAI text-embedding-3-small)
    |
    v
Vector similarity search (pgvector, cosine distance)
    Scoped to active document + session
    Threshold: 0.25, Top 8 chunks
    |
    v
Chunks found?
    Yes -> Use as context
    No  -> Fallback: load all chunks from active document
    |
    v
Inject as system message -> AI generates grounded response
```

---

## Document Relevance Guard

A two-layer classification system prevents non-PM documents from being processed:

### Layer 1: Filename Check

Hard-reject if filename contains: resume, cv, curriculum vitae, cover letter

### Layer 2: Content Analysis

- **Accept** if any PM-relevant keyword is found (e.g., prd, roadmap, product manager, user story, mvp, go-to-market, etc.)
- **Reject** only if 2 or more strong resume-specific phrases are detected AND no PM keywords exist (e.g., work experience, employment history, references available upon request)
- **Unknown** (pass through to AI) if neither condition is met — erring on the side of acceptance

The guard only runs when the user message references uploaded documents (keywords like summarize, this document, uploaded, etc.).

---

## Supported Artifact Types

| Artifact | Format | Key Sections |
|---|---|---|
| Document Summary | Flowing prose with bold highlights | 2-3 paragraphs, no tables |
| PRD | Headers and bullet points | Problem, Persona, Goals, Features, Journey, Requirements, Risks, Metrics, Rollout |
| User Stories | Markdown table | Epic, Story ID, User Story, Acceptance Criteria, Priority |
| Roadmap | Markdown table | Timeline (Now/Next/Later), Initiative, Description, Key Features, Success Metric |
| Metrics Plan | Markdown table | Category, Metric Name, Description, How to Measure, Success Target |
| Stakeholder Update | Email format | Subject line, Progress, Focus, Next Steps, Risks and Blockers |

---

## Self-Hosting / Open-Source Deployment

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project (free tier works)
- An [OpenAI API key](https://platform.openai.com/api-keys) for embeddings

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd aiden
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Enable the `vector` extension: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Go to **SQL Editor** and run each migration file in `supabase/migrations/` in order

### 3. Configure Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 4. Set Up Supabase Secrets

In your Supabase dashboard → **Edge Functions → Secrets**:

| Secret Name | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key (for embeddings) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (Settings → API) |

### 5. Deploy Edge Functions

```bash
npx supabase functions deploy chat
npx supabase functions deploy embed-document
```

### 6. Run Locally

```bash
npm run dev
```

Visit `http://localhost:5173` — you'll see the login page. Create an account and start chatting!

### 7. Authentication

Email/password auth is built in. Auto-confirm is enabled by default so users can sign in immediately after signup. To require email verification, update Supabase Auth settings in the dashboard.

**Data Isolation**: Each user's data is fully isolated via Row-Level Security (RLS) policies. Users can only see their own chat sessions, messages, documents, and feedback.

---

## Security Notes

- **No private keys in code** — All sensitive credentials are stored as edge function secrets
- **Row-Level Security (RLS)** — All tables have RLS enabled with per-user policies
- **User isolation** — Documents, chats, and feedback are scoped by authenticated user ID
- **Content truncation** — Document content capped at 100K chars; feedback at 2K chars
- **Input validation** — Edge functions validate all inputs before processing

---

## Limitations and Future Roadmap

### Current Limitations

- Maximum 2 documents per session
- Maximum file size: 10MB
- Embeddings require OpenAI API key

### Future Enhancements

- Export artifacts to PDF/DOCX
- Copy-to-clipboard on AI responses
- Multi-document cross-referencing
- Custom artifact templates
- Team collaboration features
- Integration with project management tools (Jira, Linear, Notion)

---

Built with love for Product Managers.
