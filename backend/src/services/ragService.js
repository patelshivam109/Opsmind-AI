const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chunk = require('../models/Chunk');
const { embedText } = require('./embeddingService');

let genAI = null;
const getClient = () => {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
};

const TOP_K = 5;

/**
 * Build the anti-hallucination system prompt
 */
const buildSystemPrompt = (contextChunks) => {
  const contextText = contextChunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}] ${chunk.sourceFile} (Page ${chunk.pageNumber})\n---\n${chunk.text}\n`
    )
    .join('\n');

  return `You are OpsMind AI, an intelligent corporate SOP assistant. You help employees find accurate answers from company Standard Operating Procedures (SOPs).

STRICT RULES YOU MUST FOLLOW:
1. Answer ONLY using information found in the SOP context provided below.
2. Cite your source for EVERY claim using the format: "According to [Document Name], Page [X]..."
3. If the answer is NOT present in the context, respond with EXACTLY this message:
   "I don't have information about this topic in the available SOPs. Please contact your HR or Compliance team for assistance."
4. NEVER fabricate policies, procedures, numbers, or document names.
5. Be concise and professional. Use bullet points for multi-step procedures.
6. Always end your answer with a "Sources:" section listing all cited documents.

--- SOP CONTEXT BEGIN ---
${contextText}
--- SOP CONTEXT END ---`;
};

/**
 * Perform vector search on Atlas and return top K relevant chunks
 */
const vectorSearch = async (queryEmbedding, queryText) => {
  try {
    const results = await Chunk.aggregate([
      {
        $vectorSearch: {
          index: 'sop_vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 150,
          limit: TOP_K,
        },
      },
      {
        $project: {
          text: 1,
          metadata: 1,
          documentId: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    return results;
  } catch (error) {
    console.warn('Vector search failed, falling back to text search:', error.message);

    // ── Keyword fallback ──────────────────────────────────────────
    // Split query into keywords and search text field
    const keywords = queryText
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);

    if (keywords.length === 0) return [];

    // Build a simple regex OR query across all keywords
    const regexPattern = keywords.join('|');
    const fallback = await Chunk.find({
      text: { $regex: regexPattern, $options: 'i' },
    })
      .limit(TOP_K)
      .lean();

    // Add a synthetic score
    return fallback.map((chunk) => ({ ...chunk, score: 0.6 }));
  }
};


/**
 * Main RAG search: embed query → vector search → assemble context
 */
const search = async (query) => {
  // 1. Embed the user query
  const queryEmbedding = await embedText(query);

  // 2. Vector search in Atlas (with text fallback)
  const rawChunks = await vectorSearch(queryEmbedding, query);


  if (rawChunks.length === 0) {
    return {
      context: null,
      sources: [],
      systemPrompt: buildSystemPrompt([]),
    };
  }

  // 3. Map to clean source objects
  const sources = rawChunks.map((chunk, i) => ({
    index: i + 1,
    sourceFile: chunk.metadata.sourceFile,
    pageNumber: chunk.metadata.pageNumber,
    chunkIndex: chunk.metadata.chunkIndex,
    text: chunk.text,
    score: Math.round((chunk.score || 0) * 100) / 100,
    documentId: chunk.documentId,
  }));

  // 4. Build system prompt with context injected
  const systemPrompt = buildSystemPrompt(sources);

  return { sources, systemPrompt };
};

// Model priority list — tried in order until one works
const CHAT_MODELS = [
  'gemini-flash-latest',    // ✅ confirmed working
  'gemini-2.5-flash',       // fallback when available
  'gemini-2.0-flash-lite',  // last resort
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Stream a chat response — auto-retries with fallback models on 503
 */
const streamAnswer = async (query, chatHistory, systemPrompt, onChunk, onDone) => {
  const client = getClient();

  const history = (chatHistory || []).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  let lastError = null;

  for (const modelName of CHAT_MODELS) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(query);

      let fullText = '';
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }

      onDone(fullText);
      return; // success — exit
    } catch (error) {
      const is503 = error.message.includes('503') || error.message.includes('Service Unavailable');
      const is429 = error.message.includes('429') || error.message.includes('quota');
      console.warn(`[Chat] Model ${modelName} failed (${is503 ? '503' : is429 ? '429' : 'error'}), trying next...`);
      lastError = error;
      if (is503 || is429) {
        await sleep(1000); // brief pause before retry
        continue;
      }
      throw new Error(`LLM error: ${error.message}`);
    }
  }

  throw new Error(`All models unavailable. Last error: ${lastError?.message}`);
};


module.exports = { search, streamAnswer, buildSystemPrompt };
