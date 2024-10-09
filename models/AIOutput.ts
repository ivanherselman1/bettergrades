// models/AIOutput.ts

import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface AIOutputDoc extends MongooseDocument {
  aiOutputId: string;
  documentId: string;
  generatedAt: Date;
  outputType: 'lesson' | 'test';
  content: any;
}

const AIOutputSchema: Schema = new Schema({
  aiOutputId: { type: String, required: true, unique: true },
  documentId: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  outputType: { type: String, enum: ['lesson', 'test'], required: true },
  content: { type: Schema.Types.Mixed },
});

export default mongoose.models.AIOutput ||
  mongoose.model<AIOutputDoc>('AIOutput', AIOutputSchema);
