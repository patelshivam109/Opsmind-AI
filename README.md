# OpsMind AI — Enterprise SOP Knowledge Agent

A production-ready RAG (Retrieval-Augmented Generation) system that answers employee questions from your company SOPs with precise source citations and zero hallucinations.

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free M0 tier works)
- Google Gemini API Key

---

## 🔧 Setup

### Step 1 — Backend Configuration

Edit `backend/.env`:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

### Step 2 — Start Servers

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open: **http://localhost:5173**

---

## 🔍 MongoDB Atlas Vector Search Index Setup

> This is required before the RAG search will work!

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to your cluster → **Search Indexes** (or **Atlas Search**)
3. Click **Create Search Index** → Choose **JSON Editor**
4. Select database: `opsmind`, collection: `chunks`
5. Set index name: **`sop_vector_index`**
6. Paste this JSON:

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

7. Click **Create** (takes ~2 minutes to build)

---

## 🏗️ Architecture

```
User Question → [Embed Query] → [MongoDB Atlas Vector Search]
                                        ↓
                            Top 5 Most Relevant SOP Chunks
                                        ↓
                         [Gemini 1.5 Flash with Context]
                                        ↓
                        Streaming Answer + Source Citations
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| PDF Parsing | `pdf-parse` |
| Embeddings | Gemini `text-embedding-004` (768 dims) |
| LLM | Gemini `gemini-1.5-flash` |
| Vector DB | MongoDB Atlas Vector Search |
| Streaming | Server-Sent Events (SSE) |

---

## 🛡️ Anti-Hallucination

The system prompt strictly instructs the AI to:
1. Answer **only** from provided SOP context
2. **Cite every claim** with document name + page number
3. Respond with `"I don't have information about this..."` for off-topic questions
4. **Never fabricate** policies, procedures, or document names

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/docs/upload` | Upload a PDF (multipart/form-data, field: `pdf`) |
| `GET` | `/api/docs` | List all documents + stats |
| `DELETE` | `/api/docs/:id` | Delete document + all chunks |
| `POST` | `/api/chat` | Send a query, receive SSE stream |
| `GET` | `/api/chat/health` | Health check |

---

## 📁 Project Structure

```
opsmind-ai/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── models/
│   │   │   ├── Document.js       # PDF metadata model
│   │   │   └── Chunk.js          # Text chunk + embedding model
│   │   ├── services/
│   │   │   ├── pdfService.js     # PDF parse + 1000-char chunking
│   │   │   ├── embeddingService.js # Gemini text-embedding-004
│   │   │   └── ragService.js     # Vector search + LLM streaming
│   │   ├── routes/
│   │   │   ├── documents.js      # Upload/list/delete endpoints
│   │   │   └── chat.js           # SSE chat endpoint
│   │   └── server.js
│   └── .env
└── frontend/
    └── src/
        ├── components/
        │   ├── ChatInterface.jsx  # Main chat + SSE streaming
        │   ├── MessageBubble.jsx  # AI/User messages + markdown
        │   ├── SourceCitation.jsx # Clickable source cards
        │   ├── AdminPanel.jsx     # Upload/manage documents
        │   └── Sidebar.jsx        # Navigation + chat history
        └── services/api.js        # API + SSE client
```
