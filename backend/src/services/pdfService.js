const pdfParse = require('pdf-parse');
const fs = require('fs');

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 100;

/**
 * Parse a PDF file and return structured page text
 */
const parsePDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return {
    text: data.text,
    pageCount: data.numpages,
    info: data.info,
  };
};

/**
 * Split text into overlapping chunks with page number tracking
 */
const chunkText = (fullText, sourceFile, pageCount) => {
  const chunks = [];
  const cleanText = fullText.replace(/\r\n/g, '\n').replace(/\s+\n/g, '\n').trim();

  // Estimate chars per page for approximate page attribution
  const charsPerPage = cleanText.length / Math.max(pageCount, 1);

  let start = 0;
  let chunkIndex = 0;

  while (start < cleanText.length) {
    const end = Math.min(start + CHUNK_SIZE, cleanText.length);
    const chunkText = cleanText.slice(start, end).trim();

    if (chunkText.length < 50) {
      // Skip tiny trailing chunks
      break;
    }

    // Approximate page number based on character position
    const midPoint = (start + end) / 2;
    const approxPage = Math.ceil(midPoint / charsPerPage);
    const pageNumber = Math.min(Math.max(approxPage, 1), pageCount || 1);

    chunks.push({
      text: chunkText,
      metadata: {
        pageNumber,
        chunkIndex,
        sourceFile,
        totalChunks: 0, // filled after all chunks are created
      },
    });

    chunkIndex++;
    // Move forward by chunk size minus overlap
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  // Update totalChunks in metadata
  chunks.forEach((c) => {
    c.metadata.totalChunks = chunks.length;
  });

  return chunks;
};

/**
 * Full pipeline: parse PDF → chunk text
 */
const processPDF = async (filePath, originalName) => {
  try {
    const { text, pageCount } = await parsePDF(filePath);
    const chunks = chunkText(text, originalName, pageCount);
    return { chunks, pageCount };
  } catch (error) {
    throw new Error(`PDF processing failed: ${error.message}`);
  }
};

module.exports = { processPDF, parsePDF, chunkText };
