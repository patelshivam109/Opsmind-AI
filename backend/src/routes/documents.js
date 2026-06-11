const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const upload = require('../middleware/upload');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { processPDF } = require('../services/pdfService');
const { embedBatch } = require('../services/embeddingService');

/**
 * POST /api/docs/upload
 * Admin-only: Upload a PDF, parse, chunk, embed, store in Atlas
 */
router.post('/upload', authMiddleware, adminMiddleware, upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded.' });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  // Create document record immediately with "processing" status
  const doc = new Document({
    originalName,
    fileName: req.file.filename,
    fileSize: req.file.size,
    status: 'processing',
  });
  await doc.save();

  // Respond immediately so the admin UI doesn't hang
  res.status(202).json({
    message: 'Document upload received. Processing in background...',
    document: {
      _id: doc._id,
      originalName: doc.originalName,
      status: doc.status,
      uploadedAt: doc.uploadedAt,
    },
  });

  // Process asynchronously
  setImmediate(async () => {
    try {
      console.log(`\n📄 Processing: ${originalName}`);

      // 1. Parse PDF and chunk
      const { chunks, pageCount } = await processPDF(filePath, originalName);
      console.log(`  ✂️  Created ${chunks.length} chunks from ${pageCount} pages`);

      if (chunks.length === 0) {
        throw new Error(
          'No readable text was found in this PDF. Please upload a text-based PDF instead of a scanned image PDF.'
        );
      }

      // 2. Generate embeddings for all chunks
      const texts = chunks.map((c) => c.text);
      const embeddings = await embedBatch(texts);
      console.log(`  🔢 Generated ${embeddings.length} embeddings`);

      // 3. Build chunk documents
      const chunkDocs = chunks.map((chunk, i) => ({
        documentId: doc._id,
        text: chunk.text,
        embedding: embeddings[i],
        metadata: {
          ...chunk.metadata,
          sourceFile: originalName,
        },
      }));

      // 4. Insert all chunks
      await Chunk.insertMany(chunkDocs);
      console.log(`  💾 Stored ${chunkDocs.length} chunks in Atlas`);

      // 5. Update document status
      await Document.findByIdAndUpdate(doc._id, {
        status: 'indexed',
        pageCount,
        chunkCount: chunks.length,
      });

      console.log(`  ✅ "${originalName}" fully indexed!\n`);
    } catch (error) {
      console.error(`  ❌ Failed to process "${originalName}":`, error.message);
      await Document.findByIdAndUpdate(doc._id, {
        status: 'error',
        errorMessage: error.message,
      });
    } finally {
      // Clean up temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });
});

/**
 * GET /api/docs
 * List all documents with stats
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    const totalChunks = await Chunk.countDocuments();

    res.json({
      documents,
      stats: {
        totalDocuments: documents.length,
        totalChunks,
        indexedDocuments: documents.filter((d) => d.status === 'indexed').length,
        processingDocuments: documents.filter((d) => d.status === 'processing').length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/docs/:id
 * Get a single document with its chunks
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const chunkCount = await Chunk.countDocuments({ documentId: doc._id });
    res.json({ document: doc, chunkCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/docs/:id
 * Admin-only: Delete a document and all its chunks
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Delete all chunks associated with this document
    const { deletedCount } = await Chunk.deleteMany({ documentId: doc._id });

    // Delete document record
    await Document.findByIdAndDelete(req.params.id);

    console.log(`🗑️  Deleted "${doc.originalName}" and ${deletedCount} chunks`);

    res.json({
      message: `"${doc.originalName}" and ${deletedCount} chunks deleted successfully.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
