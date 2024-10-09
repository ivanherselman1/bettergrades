// app/api/upload/route.ts

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectToDatabase from '@/lib/mongodb';
import DocumentModel, { mergePageSelections } from '@/models/Document';
import AWS from 'aws-sdk';

export const POST = async (req: NextRequest) => {
  try {
    await connectToDatabase();

    const formData = await req.formData();

    const files = formData.getAll('files') as File[];
    const tags = formData.get('tags') as string | null;
    const pageRanges = formData.get('pageRanges') as string | null;
    const selectedPages = formData.get('selectedPages') as string | null;
    const documentType = formData.get('documentType') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual user ID from authentication
    const userId = 'userId_placeholder';

    // Initialize AWS S3
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    const s3 = new AWS.S3();

    const uploadedDocuments = [];

    for (const file of files) {
      const documentId = uuidv4();
      const fileName = file.name;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const bucketName = process.env.AWS_S3_BUCKET_NAME;
      if (!bucketName) {
        throw new Error('AWS_S3_BUCKET_NAME is not defined in the environment variables');
      }

      const s3Params: AWS.S3.PutObjectRequest = {
        Bucket: bucketName,
        Key: `documents/${documentId}/${fileName}`,
        Body: buffer,
        ContentType: file.type,
      };

      await s3.upload(s3Params).promise();

      const mergedSelectedPages = mergePageSelections(
        pageRanges || '',
        selectedPages ? selectedPages.split(',').map(Number).filter(n => !isNaN(n)) : []
      );

      const document = new DocumentModel({
        documentId,
        userId,
        fileName,
        documentType: documentType || 'PDF', // Default to PDF if not specified
        tags: tags ? tags.split(',') : [],
        selectedPages: mergedSelectedPages,
        status: 'uploaded',
      });

      await document.save();

      uploadedDocuments.push({ status: 'uploaded', documentId });
    }

    return NextResponse.json({ uploadedDocuments });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
};
