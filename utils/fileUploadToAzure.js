const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

// Replace these with your values
const connectionString =
  process.env.AZURE_STORAGE_CONNECTION_STRING
const containerName = "data";

// Function to upload a file to Azure Blob Storage
const uploadFileToAzure = async (filePath, fileName) => {
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  console.log("string", connectionString);

  const containerClient = blobServiceClient.getContainerClient(containerName);
  console.log(containerClient, "container client");

  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  console.log(blockBlobClient, "blockblob client");

  // Uploads the file
  await blockBlobClient.uploadFile(filePath);
  console.log(`File "${fileName}" uploaded successfully line number 19`);

  const fileUrl = `${containerClient.url}/${fileName}`;
  console.log("Generated file URL:", fileUrl);
  return fileUrl;
};

// Function to delete a file from Azure Blob Storage
const deleteFileFromAzure = async (fileName) => {
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  // Deletes the file
  await blockBlobClient.delete();
  console.log(`File "${fileName}" deleted successfully.`);
};

const uploadImage = async (imageFile) => {
  console.log(imageFile, "line 35 image file");
  if (!imageFile || !imageFile.path) {
    throw new Error("No image file found");
  }

  try {
    // Log the image path
    console.log("Inside image upload function:", imageFile.path, imageFile);

    const originalFileName = imageFile.originalname;
    const fileName = `images/${uuidv4()}-${originalFileName}`;
    const filePath = imageFile.path;

    // Upload file to Azure and get the URL
    const imageUrl = await uploadFileToAzure(filePath, fileName);
    console.log("Uploaded Image URL:", imageUrl);

    // Clean up the file from local storage after upload
    fs.unlinkSync(filePath);

    return imageUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new AppError("Failed to upload image", 500);
  }
};

// Correct way to export both functions
module.exports = {
  uploadFileToAzure,
  deleteFileFromAzure,
  uploadImage,
};
