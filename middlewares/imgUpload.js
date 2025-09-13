const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// Set storage engine
const storage = multer.diskStorage({
  destination: "/tmp", // Define the destination folder
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + "-" + crypto.randomBytes(4).toString("hex");
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// Initialize upload variable
const upload = multer({
  storage: storage,
  limits: { fileSize: 4.5 * 1024 * 1024, fieldSize: 10 * 1024 * 1024 },
});

module.exports = upload;
