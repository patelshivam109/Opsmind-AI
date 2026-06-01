const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getClient = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

// ✅ Correct model name as returned by ListModels API
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMS = 3072;       // gemini-embedding-001 produces 3072-dim vectors
const BATCH_SIZE = 10;             // stay conservative
const RATE_LIMIT_DELAY = 600;      // ms between batches

/**
 * Sleep helper for rate limiting
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate embedding for a single text (used at query time)
 */
const embedText = async (text) => {
  const client = getClient();
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent({
    content: { parts: [{ text }], role: 'user' },
  });
  return result.embedding.values;
};

/**
 * Generate embeddings for an array of texts in batches (used at upload time)
 * Returns array of embedding vectors in same order as input
 */
const embedBatch = async (texts) => {
  const allEmbeddings = [];
  const client = getClient();
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(
      `  📦 Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} chunks)...`
    );

    const batchResults = await Promise.all(
      batch.map(async (text) => {
        try {
          const result = await model.embedContent({
            content: { parts: [{ text }], role: 'user' },
          });
          return result.embedding.values;
        } catch (err) {
          console.error('Embedding error for chunk, using zero vector:', err.message);
          return new Array(EMBEDDING_DIMS).fill(0); // fallback zero vector
        }
      })
    );

    allEmbeddings.push(...batchResults);

    // Rate limit delay between batches
    if (i + BATCH_SIZE < texts.length) {
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  return allEmbeddings;
};

module.exports = { embedText, embedBatch, EMBEDDING_DIMS };
