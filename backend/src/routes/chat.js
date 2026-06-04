const express = require('express');
const router = express.Router();
const { search, streamAnswer } = require('../services/ragService');

/**
 * POST /api/chat
 * Main RAG chat endpoint with SSE streaming
 * Body: { query: string, chatHistory: [{role, content}] }
 */
router.post('/', async (req, res) => {
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


    // Step 2: If no sources found, respond with helpful guidance
    if (!sources || sources.length === 0) {
      sendEvent('status', { message: 'No relevant documents found...' });
      const noInfoMsg =
        "📂 **No documents found in the knowledge base.**\n\nTo get started:\n1. Click **\"Knowledge Base\"** in the left sidebar\n2. Upload your SOP PDF files using the upload area\n3. Wait for them to be indexed (usually takes 30-60 seconds)\n4. Then come back and ask your question!\n\nIf you've already uploaded documents, your question may not match any content in the available SOPs. Try rephrasing or contact your HR/Compliance team.";

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
    const isOverload = error.message.includes('503') || error.message.includes('All models unavailable') || error.message.includes('Service Unavailable');
    const msg = isOverload
      ? '⚠️ The AI service is currently busy. Please wait a moment and try again.'
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
