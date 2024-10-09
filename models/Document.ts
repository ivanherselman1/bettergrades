// models/Document.ts

import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface DocumentDoc extends MongooseDocument {
  documentId: string;
  userId: string;
  fileName: string;
  documentType: 'PDF' | 'DOCX';
  uploadDate: Date;
  status:
    | 'uploaded'
    | 'extracted'
    | 'imagesProcessed'
    | 'aiProcessed'
    | 'completed'
    | 'failed';
  tags: string[];
  selectedPages: string;
  extractedText?: string;
  images?: string[];
  aiOutputId?: string;
}

const DocumentSchema: Schema = new Schema({
  documentId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  fileName: { type: String, required: true },
  documentType: { type: String, enum: ['PDF', 'DOCX'], required: true },
  uploadDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: [
      'uploaded',
      'extracted',
      'imagesProcessed',
      'aiProcessed',
      'completed',
      'failed',
    ],
    default: 'uploaded',
  },
  tags: [{ type: String }],
  selectedPages: { type: String, required: true },
  extractedText: { type: String },
  images: [{ type: String }],
  aiOutputId: { type: String },
});

// Helper function to merge and deduplicate page selections
export function mergePageSelections(manualRanges: string | undefined, individualPages: number[]): string {
  const allPages: Set<number> = new Set();

  // Parse manual ranges
  if (manualRanges) {
    manualRanges.split(',').forEach(range => {
      const parts = range.trim().split('-');
      const start = parts[0] ? parseInt(parts[0], 10) : NaN;
      const end = parts.length > 1 && parts[1] ? parseInt(parts[1], 10) : start;

      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          allPages.add(i);
        }
      }
    });
  }

  // Add individual pages
  individualPages.forEach(page => allPages.add(page));

  // Convert back to a string representation
  return Array.from(allPages)
    .sort((a, b) => a - b)
    .reduce((acc: string, page: number, index: number, array: number[]): string => {
      if (index === 0 || page !== (array[index - 1] as number) + 1) {
        return acc ? `${acc},${page}` : `${page}`;
      } else if (index === array.length - 1 || page + 1 !== array[index + 1]) {
        return `${acc}-${page}`;
      }
      return acc;
    }, '');
}

export default mongoose.models.Document ||
  mongoose.model<DocumentDoc>('Document', DocumentSchema);
