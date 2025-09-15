const crypto = require("crypto");

function generateApiSecret(length = 64) {
  return crypto.randomBytes(length).toString("hex");
}

// Example usage:
const apiSecret = generateApiSecret(); // 32 bytes → 64 hex chars
console.log("API Secret:", apiSecret);
