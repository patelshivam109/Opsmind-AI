# OpsMind AI Project Report

## 1. Project Title

OpsMind AI - Enterprise SOP Knowledge Agent

## 2. Project Overview

OpsMind AI is a web-based AI assistant for company Standard Operating Procedure documents. It allows administrators to upload SOP PDFs and allows employees to ask natural-language questions. The system retrieves relevant document sections and generates answers with source citations.

The goal is to reduce manual document searching and help employees get accurate answers from approved internal documents.

## 3. Problem Statement

Employees often need to search long SOPs, HR policies, compliance documents, or process manuals to find exact instructions. This is slow, inconsistent, and can lead to wrong interpretations.

OpsMind AI solves this by turning SOP PDFs into a searchable AI knowledge base with cited answers.

## 4. Objectives

- Build a secure web application for SOP question answering.
- Allow admins to upload and manage PDF documents.
- Extract and chunk PDF text for retrieval.
- Generate embeddings and store them in MongoDB Atlas.
- Retrieve relevant chunks using vector search.
- Generate answers only from retrieved SOP context.
- Display source citations for transparency.
- Restrict document management features to admin users.

## 5. Existing Modules

### Authentication Module

- User registration
- User login
- JWT token generation
- Password hashing using bcrypt
- Admin and employee roles

### Knowledge Base Module

- Admin-only PDF upload
- PDF type validation
- 50 MB upload limit
- Background indexing
- Document status tracking
- Document deletion with related chunks

### RAG Chat Module

- User question embedding
- MongoDB Atlas Vector Search
- Keyword fallback search
- Gemini chat model response generation
- Server-Sent Events streaming
- Source citation display

### Frontend Module

- Login and registration screen
- Sidebar with chat sessions
- Chat interface
- Knowledge base admin panel
- Upload progress display
- Document dashboard
- Toast notifications

## 6. Technology Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| AI Embeddings | Gemini `gemini-embedding-001` |
| AI Response | Gemini Flash models |
| PDF Processing | pdf-parse |
| Authentication | JWT, bcryptjs |
| File Upload | multer |
| Streaming | Server-Sent Events |

## 7. System Architecture

```text
User/Admin
-> React Frontend
-> Express Backend API
-> MongoDB Atlas
-> Gemini Embedding Model
-> MongoDB Atlas Vector Search
-> Gemini Chat Model
-> Streaming cited answer
```

### Document Upload Flow

```text
Admin uploads PDF
-> Backend validates file
-> Document is saved with processing status
-> PDF text is extracted
-> Text is split into chunks
-> Gemini embeddings are generated
-> Chunks are stored in MongoDB Atlas
-> Document status becomes indexed
```

### Chat Flow

```text
Employee asks question
-> Question embedding is generated
-> Similar chunks are retrieved from MongoDB Atlas
-> Retrieved context is sent to Gemini
-> Answer streams back to frontend
-> Sources are shown to the user
```

## 8. Database Collections

### users

Stores user profile, email, hashed password, role, and creation date.

### documents

Stores uploaded PDF metadata:

- Original file name
- Stored file name
- File size
- Page count
- Chunk count
- Processing status
- Error message if processing fails

### chunks

Stores searchable document chunks:

- Document reference
- Chunk text
- Embedding vector
- Page number
- Chunk index
- Source file name

## 9. Current Progress

Completed:

- Project structure created.
- Frontend UI implemented.
- Backend API implemented.
- Authentication implemented.
- Admin and employee roles implemented.
- PDF upload implemented.
- PDF parsing and chunking implemented.
- Gemini embedding generation implemented.
- MongoDB chunk storage implemented.
- Vector search retrieval implemented.
- Chat response streaming implemented.
- Source citations implemented.
- README updated.
- Mid-review preparation document added.
- Frontend build verified.
- Backend syntax verified.

In progress / next:

- Production deployment.
- More automated tests.
- Server-side chat history.
- Better document preview.
- Password reset and profile management.
- More analytics for admin dashboard.

## 10. Demonstration Plan

1. Start backend from `backend_local`.
2. Start frontend from `frontend`.
3. Login as admin.
4. Open Knowledge Base.
5. Upload a sample SOP PDF.
6. Show processing and indexed status.
7. Ask a question from the uploaded SOP.
8. Show the answer streaming in chat.
9. Show source citations.
10. Ask an unrelated question and show restricted answer behavior.
11. Login as employee and show upload/delete access restrictions.

## 11. Challenges Faced

- MongoDB Atlas Vector Search requires correct index dimensions.
- Gemini model names and embedding dimensions must match backend configuration.
- PDF page number attribution is approximate because plain text extraction does not always preserve page boundaries perfectly.
- AI service quota or temporary availability can affect response generation.
- Background document processing needs polling in the frontend.
- Local browser chat history is easy for demo, but server-side persistence is needed for production.

## 12. Future Enhancements

- Store chat sessions in MongoDB.
- Add automated unit and integration tests.
- Add document preview with highlighted source sections.
- Add password reset.
- Add file re-indexing.
- Add multi-tenant company support.
- Add production deployment configuration.
- Add audit logs for admin actions.

## 13. Conclusion

OpsMind AI currently has the core working modules required for the mid review: authentication, role-based access, document upload, AI indexing, vector search, streaming chat, source citations, and a usable frontend. The project is ready to demonstrate as a functional prototype, with clear next steps for production readiness.
