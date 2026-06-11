# Mid Review Preparation - OpsMind AI

Use this file as your review checklist and quick speaking notes.

## Project Summary

OpsMind AI is an enterprise SOP knowledge assistant. Admins upload SOP PDFs, the backend parses and indexes the documents, and employees ask questions in natural language. The AI answers only from indexed SOP content and includes source citations with document names and page numbers.

## Current Progress

- Frontend authentication page is implemented.
- JWT-based login and registration are implemented.
- Role-based access is implemented for admin and employee users.
- Admin knowledge base screen is implemented.
- PDF upload, validation, and background processing are implemented.
- PDF text extraction, chunking, and embedding generation are implemented.
- MongoDB document and chunk storage is implemented.
- MongoDB Atlas Vector Search retrieval is implemented.
- Keyword fallback is available if vector search fails.
- Chat interface with streaming responses is implemented.
- Source citation display is implemented.
- Local browser chat history is implemented.
- Frontend production build passes.
- Backend JavaScript syntax checks pass.

## Demo Requirements

Prepare these before the review:

- Working `.env` in `backend_local`.
- MongoDB Atlas cluster access.
- Atlas Vector Search index named `sop_vector_index`.
- Gemini API key with available quota.
- At least one clean sample SOP PDF for upload.
- Admin account ready.
- Employee account ready, or create one during the demo.

## Run Commands

Backend:

```bash
cd backend_local
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

## Admin Account

Create or promote admin:

```bash
cd backend_local
node scripts/makeAdmin.js
```

Default generated admin:

```text
Email: admin@opsmind.ai
Password: Admin@123
```

## Demo Script

1. Login as admin.
2. Open Knowledge Base.
3. Explain that only admins can upload and delete SOPs.
4. Show the dashboard stats: total documents, indexed documents, chunks, and processing.
5. Upload a sample PDF.
6. Explain background indexing: parse PDF, split text into chunks, generate embeddings, save chunks to MongoDB.
7. Wait until document status changes to `Indexed`.
8. Open chat and ask a question from the uploaded SOP.
9. Point out the streaming response and source citations.
10. Ask one unrelated question to show the anti-hallucination fallback.
11. Switch to employee account and show upload/delete restrictions.

## Architecture Talking Points

Request flow:

```text
User question
-> Gemini embedding
-> MongoDB Atlas Vector Search
-> Top relevant SOP chunks
-> Gemini chat model with strict context prompt
-> Streaming answer with citations
```

Storage:

- `documents` collection stores PDF metadata, status, page count, and chunk count.
- `chunks` collection stores chunk text, source metadata, and 768-dimension embeddings by default.

Security:

- Passwords are hashed with bcrypt.
- JWT is used for authenticated requests.
- Upload and delete operations require admin role.
- Employees can view and query documents but cannot modify the knowledge base.

## Known Challenges

- MongoDB Atlas Vector Search setup must exactly match the embedding dimensions.
- Gemini API quota or temporary service errors can affect upload embedding or chat responses.
- PDF extraction quality depends on the source PDF text quality.
- Uploaded documents are indexed asynchronously, so the UI must poll status.
- Current chat history is stored in browser local storage, not in the database.
- `JWT_SECRET` should be set in production instead of relying on the fallback value.

## Questions You May Be Asked

What problem does this solve?

It reduces time spent searching long SOP documents and gives employees accurate, cited answers.

Why RAG instead of only an LLM?

RAG grounds the answer in company documents, which reduces hallucination and keeps responses tied to current SOPs.

How do you prevent hallucination?

The backend sends only retrieved SOP chunks to the model and uses a strict system prompt that instructs the model to answer only from those chunks and cite each claim.

How is access controlled?

Users authenticate with JWT. Admin routes require both a valid token and an admin role.

What is incomplete or next?

Production deployment, persistent server-side chat history, better document preview, stronger automated tests, password reset, and richer admin analytics.

## Final Readiness Checklist

- Pull latest code and confirm `backend_local` is the active backend.
- Confirm `.env` values are present.
- Confirm Atlas index uses `numDimensions: 768` unless `EMBEDDING_DIMS` is changed.
- Run backend and frontend.
- Run `npm run build` in `frontend`.
- Login as admin successfully.
- Upload one sample PDF successfully.
- Ask at least two questions and confirm citations appear.
- Prepare one slide or short explanation for architecture.
- Prepare one short list of challenges and next steps.
