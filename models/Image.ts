// models/Image.ts

import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface ImageDoc extends MongooseDocument {
  imageId: string;
  documentId: string;
  s3Url: string;
  description?: string;
  position: number;
}

const ImageSchema: Schema = new Schema({
  imageId: { type: String, required: true, unique: true },
  documentId: { type: String, required: true },
  s3Url: { type: String, required: true },
  description: { type: String },
  position: { type: Number, required: true },
});

export default mongoose.models.Image ||
  mongoose.model<ImageDoc>('Image', ImageSchema);
