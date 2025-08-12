const parseIfString = (data) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (err) {
      console.error("Failed to parse JSON:", data);
      return {};
    }
  }
  return data;
};

module.exports = parseIfString;
