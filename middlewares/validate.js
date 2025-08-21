const AppError = require("../utils/appError");

module.exports = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    // Option 1: using AppError (recommended if you have centralized error handler)
    return next(
      new AppError(error.details.map((d) => d.message).join(", "), 400)
    );

    // Option 2: send JSON directly (if you don't want AppError here)
    /*
    return res.status(400).json({
      success: false,
      errors: error.details.map((d) => d.message),
    });
    */
  }

  next();
};
