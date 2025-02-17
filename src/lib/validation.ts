export interface VideoValidationResult {
  isValid: boolean;
  error?: string;
}

export async function validateVideo(file: File): Promise<VideoValidationResult> {
  // Check file size (100MB max for Bluesky)
  const MAX_SIZE_MB = 100;
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB > MAX_SIZE_MB) {
    return {
      isValid: false,
      error: `Video must be smaller than ${MAX_SIZE_MB}MB`
    };
  }

  // Check video duration
  try {
    const video = document.createElement('video');
    video.preload = 'metadata';

    const duration = await new Promise<number>((resolve, reject) => {
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = () => reject('Error loading video');
      video.src = URL.createObjectURL(file);
    });

    URL.revokeObjectURL(video.src);

    const MAX_DURATION_SECONDS = 60;
    if (duration > MAX_DURATION_SECONDS) {
      return {
        isValid: false,
        error: `Video must be shorter than ${MAX_DURATION_SECONDS} seconds`
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Could not validate video file'
    };
  }
} 