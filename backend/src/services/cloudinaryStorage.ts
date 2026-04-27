import { v2 as cloudinary } from 'cloudinary';

function isCloudinaryConfigured(): boolean {
  const url = process.env.CLOUDINARY_URL || '';
  // Check for placeholder value
  if (url.includes('YOUR_API_SECRET_HERE') || url.includes('your_api_secret')) return false;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return !!(url || (cloud && key && secret));
}

function configure() {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary not configured. Set CLOUDINARY_URL with your actual API secret.');
  }
  cloudinary.config({ secure: true });
}

export async function uploadResume(
  fileBuffer: Buffer,
  originalName: string,
  applicationId: string
): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured()) {
    console.warn('[Cloudinary] Not configured — skipping upload, using local path only');
    return { url: '', publicId: '' };
  }
  configure();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `resumes/${applicationId}`,
        public_id: `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        resource_type: 'raw',
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
  if (!isCloudinaryConfigured() || !publicId) return;
  configure();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
}
