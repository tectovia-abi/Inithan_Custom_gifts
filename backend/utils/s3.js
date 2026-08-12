const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const { v4: uuidv4 } = require('crypto');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Upload a file buffer to S3.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} originalName - The original file name (for extension detection).
 * @param {string} folder - S3 "folder" prefix, e.g. "products" or "gallery"
 * @returns {string} The public S3 URL of the uploaded file.
 */
async function uploadToS3(buffer, originalName, folder = 'products') {
  const ext = path.extname(originalName) || '.jpg';
  const uniqueKey = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: uniqueKey,
    Body: buffer,
    ContentType: getMimeType(ext),
  });

  await s3.send(command);

  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;
}

/**
 * Upload a Base64-encoded image string to S3.
 * Used for migrating existing base64 images in MongoDB.
 * @param {string} base64String - Full base64 data URL, e.g. "data:image/jpeg;base64,/9j/..."
 * @param {string} folder - S3 folder prefix.
 * @returns {string} The public S3 URL.
 */
async function uploadBase64ToS3(base64String, folder = 'products') {
  if (!base64String || !base64String.startsWith('data:')) {
    return base64String; // Already a URL, skip
  }

  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return base64String;

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = mimeType.split('/')[1] || 'jpg';
  const uniqueKey = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: uniqueKey,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3.send(command);

  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;
}

/**
 * Delete an object from S3 by its full URL.
 */
async function deleteFromS3(url) {
  if (!url || !url.includes('.amazonaws.com/')) return;
  const key = url.split('.amazonaws.com/')[1];
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await s3.send(command);
}

function getMimeType(ext) {
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  };
  return map[ext.toLowerCase()] || 'image/jpeg';
}

module.exports = { uploadToS3, uploadBase64ToS3, deleteFromS3 };
