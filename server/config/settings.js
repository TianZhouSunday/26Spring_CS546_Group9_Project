import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const mongoConfig = {
  serverUrl: process.env.MONGO_SERVER_URL || 'mongodb://localhost:27017/',
  database: process.env.MONGO_DATABASE || 'nyc_danger_map'
};

// Export JWT secret for use by auth middleware (Person C will use this)
export const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

// Export server port
export const port = process.env.PORT || 3000;

