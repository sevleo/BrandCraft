import React, { ChangeEvent } from 'react';
import { validateVideo } from '../../lib/validation';

const VideoUpload: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Validate video before processing
      const validation = await validateVideo(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid video file');
        event.target.value = ''; // Reset input
        return;
      }

      // ... rest of existing upload code ...

    } catch (err) {
      setError('Error uploading video');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {error && (
        <div className="text-red-500 mt-2 text-sm">
          {error}
        </div>
      )}
      {isUploading && (
        <div className="mt-2">
          Uploading...
        </div>
      )}
    </div>
  );
};

export default VideoUpload; 