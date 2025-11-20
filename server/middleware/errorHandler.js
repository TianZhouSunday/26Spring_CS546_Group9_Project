// Unified error handler middleware
// This should be the last middleware in the chain (after all routes)
// Follows CS546 error handling patterns

const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error('Error:', err);
  
  // Default error status and message
  let status = err.status || err.statusCode || 500;
  
  // Handle different error types
  let message;
  if (err instanceof Error) {
    // Error object - use message property
    message = err.message || 'Internal server error';
  } else if (typeof err === 'string') {
    // String error (some CS546 code uses throw "message")
    message = err;
    status = 400; // String errors are typically validation errors
  } else {
    message = 'Internal server error';
  }
  
  // If it's a validation error or known error, use 400
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    status = 400;
  }
  
  // Return unified error format (CS546 standard: {error: "message"})
  res.status(status).json({
    error: message
  });
};

export default errorHandler;


