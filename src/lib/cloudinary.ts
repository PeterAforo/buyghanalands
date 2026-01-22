import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  error?: string;
}

export interface UploadOptions {
  folder?: string;
  transformation?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
  };
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

// Upload image from base64 or URL
export async function uploadImage(
  file: string, // base64 data URI or URL
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return { success: false, error: 'Cloudinary not configured' };
    }

    const uploadOptions: any = {
      folder: options.folder || 'buyghanalands',
      resource_type: options.resourceType || 'image',
    };

    if (options.transformation) {
      uploadOptions.transformation = [options.transformation];
    }

    const result = await cloudinary.uploader.upload(file, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

// Upload multiple images
export async function uploadImages(
  files: string[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadImage(file, options))
  );
  return results;
}

// Delete image by public ID
export async function deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return { success: false, error: 'Cloudinary not configured' };
    }

    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

// Generate optimized URL with transformations
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  } = {}
): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: options.crop || 'fill',
        quality: options.quality || 'auto',
        format: options.format || 'auto',
      },
    ],
  });
}

// Generate thumbnail URL
export function getThumbnailUrl(publicId: string, size: number = 200): string {
  return getOptimizedUrl(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    quality: 80,
  });
}

// Generate signed upload parameters for client-side upload
export function getSignedUploadParams(folder: string = 'buyghanalands'): {
  timestamp: number;
  signature: string;
  cloudName: string;
  apiKey: string;
  folder: string;
} {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}

export default cloudinary;
