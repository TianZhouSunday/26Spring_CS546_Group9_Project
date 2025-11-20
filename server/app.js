// app.js
// Following CS546 application structure patterns
import express from 'express';
import cors from 'cors';
import { dbConnection } from './config/mongoConnection.js';
import { port } from './config/settings.js';
import logger from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';
import constructorMethod from './routes/index.js';

const app = express();

// CORS middleware - allow requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// CS546 pattern: express.json() middleware MUST be applied to parse request bodies
// This is critical for POST, PUT, PATCH, DELETE routes
// Without this, req.body will be undefined!
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware - log all requests (CS546 pattern: helpful for debugging)
app.use(logger);

// Initialize database connection
// CS546 pattern: connection is established once and reused
dbConnection().catch(console.error);

// Routes
// CS546 pattern: routes are organized in routes/ folder and registered via index.js
constructorMethod(app);

// Error handler middleware - must be last
// CS546 pattern: unified error handling returns {error: "message"} format
app.use(errorHandler);

// Start server
// CS546 pattern: server listens on port 3000 (or from .env)
app.listen(port, () => {
  console.log("We've now got a server!");
  console.log(`Your routes will be running on http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});