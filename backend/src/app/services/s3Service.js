const fs = require("fs");
const path = require("path");
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3Client = require("../config/s3Config");

const BUCKET_NAME = "brandcraft-media";

// Generate a presigned URL for direct upload
async function generatePresignedUploadUrl(fileName, contentType) {
  const key = `videos/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
  return {
    uploadUrl: url,
    key: key,
  };
}

// Upload file to S3 and return the file URL
async function uploadFileToS3(
  fileBuffer,
  fileName,
  contentType = "application/octet-stream"
) {
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));
  return `https://media.brandcraft.art/${fileName}`;
}

// Download file from S3 and save it to a local path
async function downloadFileFromS3(fileUrl, destinationPath) {
  const s3Key = fileUrl.split(".art/")[1];
  const getObjectParams = { Bucket: BUCKET_NAME, Key: s3Key };
  const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(destinationPath);
    Body.pipe(writeStream).on("finish", resolve).on("error", reject);
  });
}

async function deleteFileFromS3(fileUrl) {
  const s3Key = fileUrl.split(".art/")[1];
  const deleteParams = { Bucket: BUCKET_NAME, Key: s3Key };

  try {
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log(`Deleted file from S3: ${fileUrl}`);
  } catch (error) {
    console.error(`Failed to delete file from S3: ${fileUrl}`, error);
    throw error;
  }
}

module.exports = {
  uploadFileToS3,
  downloadFileFromS3,
  deleteFileFromS3,
  generatePresignedUploadUrl,
};
