const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    metadata: {
      pageNumber: { type: Number, default: 1 },
      chunkIndex: { type: Number, required: true },
      sourceFile: { type: String, required: true },
      totalChunks: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Compound index for efficient lookups by document
chunkSchema.index({ documentId: 1, 'metadata.chunkIndex': 1 });

module.exports = mongoose.model('Chunk', chunkSchema);
