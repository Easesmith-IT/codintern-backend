const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
// const handleDuplicateFieldsDB = (err) => {
//   // const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
//   console.log("handleDuplicateFieldsDB error",err);
//   const field = Object.keys(err.keyValue)[0];
//   const value = err.keyValue[field];
//   console.log(value);
//   const message = `Duplicate field value for ${field}: ${value}. Please use another value!`;
//   return new AppError(message, 400);
// };

// Helper to prettify field names automatically
const prettifyField = (field) => {
  return field
    .replace(/([A-Z])/g, " $1") // split camelCase → camel Case
    .replace(/_/g, " ")         // replace underscores
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize words
};

const handleDuplicateFieldsDB = (err) => {
  if (!err.keyValue) {
    return new AppError("Duplicate value. Please use another one.", 400);
  }

  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];

  const label = prettifyField(field);

  const message = `${label} "${value}" is already taken. Please choose another.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDev = (err, res) => {
  console.log("inside send error dev", err);
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.error("ERROR :boom:", err);
    // 2) Send generic message
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};
module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  console.log("err catched", err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  console.log("env", process.env.NODE_ENV);

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body too large. Try uploading a smaller file.",
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File too large. Maximum allowed size is 4.5MB.",
    });
  }

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = err;
    error.message = err.message;
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    sendErrorProd(error, res);
  }
};
