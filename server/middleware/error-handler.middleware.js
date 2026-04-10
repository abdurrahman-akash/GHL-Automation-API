import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      details: err.details
    });
  }

  logger.error(
    {
      err,
      method: req.method,
      url: req.originalUrl
    },
    "Unhandled request error"
  );

  return res.status(500).json({ message: "Internal server error" });
};
