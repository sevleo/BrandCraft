import React, { ChangeEvent } from 'react';
import { validateVideo } from '../../lib/validation';

const VideoUpload: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate video before processing
    const validation = await validateVideo(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid video file');
      return;
    }

    // ... rest of existing upload code ...
  };

  return (
    <div>
      {/* ... existing JSX ... */}
    </div>
  );
};

export default VideoUpload; 