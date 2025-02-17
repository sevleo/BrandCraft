const axios = require("axios");
const MediaFile = require("../models/mediaFile");
const { uploadFileToS3 } = require("./s3Service");

class MediaRefreshService {
  async refreshMediaUrls(mediaFiles) {
    if (!mediaFiles || mediaFiles.length === 0) return [];

    const refreshedMedia = [];

    for (const media of mediaFiles) {
      try {
        // Check if URL is still valid
        const isValid = await this.isUrlValid(media.url);
        
        if (isValid) {
          refreshedMedia.push(media);
          continue;
        }

        // If URL is invalid, try to refresh it
        const refreshedUrl = await this.refreshMediaUrl(media);
        if (refreshedUrl) {
          media.url = refreshedUrl;
          await MediaFile.findByIdAndUpdate(media._id, { url: refreshedUrl });
          refreshedMedia.push(media);
        } else {
          console.error(`Failed to refresh media URL for file: ${media._id}`);
        }
      } catch (error) {
        console.error(`Error refreshing media ${media._id}:`, error);
      }
    }

    return refreshedMedia;
  }

  async isUrlValid(url) {
    try {
      const response = await axios.head(url);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async refreshMediaUrl(media) {
    try {
      // If we have a backup URL, try to use it
      if (media.urlPure) {
        const isBackupValid = await this.isUrlValid(media.urlPure);
        if (isBackupValid) {
          // Re-upload to S3 and get new URL
          const response = await axios.get(media.urlPure, {
            responseType: 'arraybuffer'
          });
          
          const newUrl = await uploadFileToS3(
            response.data,
            media.fileName,
            media.mimeType
          );
          
          return newUrl;
        }
      }

      // If we have a local file path, try to use it
      if (media.filePath) {
        // Re-upload the local file to S3
        const fs = require('fs').promises;
        const fileBuffer = await fs.readFile(media.filePath);
        
        const newUrl = await uploadFileToS3(
          fileBuffer,
          media.fileName,
          media.mimeType
        );
        
        return newUrl;
      }

      return null;
    } catch (error) {
      console.error(`Error refreshing media URL for ${media._id}:`, error);
      return null;
    }
  }
}

module.exports = new MediaRefreshService(); 