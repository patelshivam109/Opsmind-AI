# OpsMind AI - Enterprise SOP Knowledge Agent

OpsMind AI is a Retrieval-Augmented Generation (RAG) application that lets employees ask questions against company SOP PDFs and receive source-cited answers.

The active backend for this project is `backend_local`.

## Current Features

- User registration and login with JWT authentication
- Role-based access for employees and admins
- Admin-only PDF upload and document deletion
- Background PDF parsing, chunking, embedding, and indexing
- MongoDB Atlas Vector Search retrieval with keyword fallback
- Gemini-powered streaming chat answers through Server-Sent Events
- Source citations with document name and page number
- Local chat session history in the browser
- Knowledge base dashboard with document status and chunk statistics

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| Auth | JWT, bcryptjs |
| PDF Parsing | pdf-parse |
| Embeddings | Gemini `gemini-embedding-001` |
| Chat Model | Gemini Flash model fallback chain |
| Streaming | Server-Sent Events |

## Prerequisites

- Node.js 18+
- MongoDB Atlas cluster
- Google Gemini API key
- MongoDB Atlas Vector Search index

## Backend Setup

Create `backend_local/.env` from `backend_local/.env.example`:

```env
MONGO_URI=your_mongodb_atlas_connection_string_here
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=replace_with_a_strong_secret
PORT=5000
NODE_ENV=development
```

Install and run the backend:

```bash
cd backend_local
npm install
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

## Frontend Setup

Install and run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`.

## MongoDB Atlas Vector Search Index

Create a Vector Search index in MongoDB Atlas:

- Database: `opsmind`
- Collection: `chunks`
- Index name: `sop_vector_index`

Use this JSON:

```json
{
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 768,
    "similarity": "cosine"
  }]
}
```

The embedding dimension must match `EMBEDDING_DIMS` in the backend. The default is `768`, which is a recommended Gemini embedding dimension and matches the setup JSON above.

## Admin Setup

After configuring `backend_local/.env`, create or promote an admin user:

```bash
cd backend_local
node scripts/makeAdmin.js
```

To promote a specific existing user:

```bash
node scripts/makeAdmin.js user@example.com
```

Default generated admin credentials:

```text
Email: admin@opsmind.ai
Password: Admin@123
```

Change this password after first login.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register an employee user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/auth/me` | Verify current token |
| `POST` | `/api/docs/upload` | Admin-only PDF upload |
| `GET` | `/api/docs` | List documents and stats |
| `GET` | `/api/docs/:id` | Get one document summary |
| `DELETE` | `/api/docs/:id` | Admin-only document deletion |
| `POST` | `/api/chat` | Ask a question and stream the answer |
| `GET` | `/api/chat/health` | Chat health check |

## Review Demo Flow

1. Start `backend_local` and `frontend`.
2. Login as admin.
3. Open Knowledge Base.
4. Show the Atlas index JSON and document dashboard.
5. Upload a sample SOP PDF.
6. Wait for status to become `Indexed`.
7. Ask a question in chat that is answerable from the uploaded PDF.
8. Show streaming answer, citations, and source cards.
9. Ask an unrelated question and show the controlled "no information" behavior.
10. Login or register as a normal employee and show that upload/delete actions are restricted.

## Verification

The following checks were run successfully:

```bash
cd frontend
npm run build
```

```bash
cd backend_local
node -c src/server.js
node -c src/routes/auth.js
node -c src/routes/documents.js
node -c src/routes/chat.js
node -c src/services/ragService.js
node -c src/services/embeddingService.js
```
