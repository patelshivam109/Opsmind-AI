const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { search, streamAnswer } = require('../services/ragService');

/**
 * POST /api/chat
 * Main RAG chat endpoint with SSE streaming
 * Body: { query: string, chatHistory: [{role, content}] }
 */
router.post('/', authMiddleware, async (req, res) => {
  const { query, chatHistory = [] } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Step 1: Retrieve relevant chunks via vector search
    sendEvent('status', { message: 'Searching knowledge base...' });

    const ragResult = await search(query.trim());
    const { sources, systemPrompt } = ragResult;

    // Step 2: If no sources found, respond with state-specific guidance
    if (!sources || sources.length === 0) {
      const [totalDocuments, indexedDocuments, processingDocuments, errorDocuments, totalChunks] = await Promise.all([
        Document.countDocuments(),
        Document.countDocuments({ status: 'indexed' }),
        Document.countDocuments({ status: 'processing' }),
        Document.countDocuments({ status: 'error' }),
        Chunk.countDocuments(),
      ]);

      let noInfoMsg;
      if (totalDocuments === 0) {
        sendEvent('status', { message: 'No documents uploaded yet...' });
        noInfoMsg =
          'No documents have been uploaded yet.\n\nGo to Knowledge Base, upload your SOP PDF, wait until its status becomes Indexed, then ask your question again.';
      } else if (totalChunks === 0 && processingDocuments > 0) {
        sendEvent('status', { message: 'Documents are still being indexed...' });
        noInfoMsg =
          'Your document upload is still being indexed.\n\nOpen Knowledge Base and wait until the document status changes from Processing to Indexed, then ask again.';
      } else if (totalChunks === 0 && errorDocuments > 0 && indexedDocuments === 0) {
        sendEvent('status', { message: 'Uploaded documents failed to index...' });
        noInfoMsg =
          'Documents were uploaded, but indexing failed.\n\nOpen Knowledge Base and check the error shown under the uploaded file. If it says no readable text was found, upload a text-based PDF instead of a scanned image PDF.';
      } else if (totalChunks === 0) {
        sendEvent('status', { message: 'Uploaded documents have no searchable text...' });
        noInfoMsg =
          'Documents were uploaded, but no searchable text chunks were stored.\n\nDelete the affected document from Knowledge Base and upload a text-based PDF again. Scanned image PDFs need OCR before uploading.';
      } else {
        sendEvent('status', { message: 'No relevant sections matched...' });
        noInfoMsg =
          'I found uploaded documents in the knowledge base, but I could not find a relevant section for this question. Try asking with terms that appear in the SOP, or check that the uploaded document is marked Indexed in Knowledge Base.';
      }

      sendEvent('chunk', { text: noInfoMsg });
      sendEvent('sources', { sources: [] });
      sendEvent('done', { fullText: noInfoMsg });
      return res.end();
    }

    sendEvent('status', { message: `Found ${sources.length} relevant sections. Generating answer...` });

    // Step 3: Stream the LLM answer
    const streamChunks = (text) => {
      sendEvent('chunk', { text });
    };

    const onDone = (fullText) => {
      // Send sources as final event
      sendEvent('sources', {
        sources: sources.map((s) => ({
          index: s.index,
          sourceFile: s.sourceFile,
          pageNumber: s.pageNumber,
          text: s.text.substring(0, 400) + (s.text.length > 400 ? '...' : ''),
          score: s.score,
        })),
      });
      sendEvent('done', { fullText });
      res.end();
    };

    await streamAnswer(query.trim(), chatHistory, systemPrompt, streamChunks, onDone);
  } catch (error) {
    console.error('Chat error:', error.message);
    const isOverload =
      error.message.includes('503') ||
      error.message.includes('All models unavailable') ||
      error.message.includes('Service Unavailable');
    const msg = isOverload
      ? 'The AI service is currently busy. Please wait a moment and try again.'
      : 'An unexpected error occurred. Please try again.';
    sendEvent('error', { message: msg });
    res.end();
  }
});

/**
 * GET /api/chat/health
 * Health check for the RAG pipeline
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'OpsMind AI Chat' });
});

module.exports = router;
