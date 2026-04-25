import { v2 as cloudinary } from 'cloudinary';

function configure() {
  const url = process.env.CLOUDINARY_URL;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (url) {
    // CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
    cloudinary.config({ secure: true });
    return;
  }
  if (cloud && key && secret) {
    cloudinary.config({ cloud_name: cloud, api_key: key, api_secret: secret, secure: true });
    return;
  }
  throw new Error('Cloudinary not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET');
}

export async function uploadResume(
  fileBuffer: Buffer,
  originalName: string,
  applicationId: string
): Promise<{ url: string; publicId: string }> {
  configure();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `resumes/${applicationId}`,
        public_id: `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        resource_type: 'raw', // required for PDFs and non-image files
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function deleteResume(publicId: string): Promise<void> {
  configure();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
}
