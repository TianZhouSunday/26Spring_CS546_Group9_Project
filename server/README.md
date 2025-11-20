# Backend Server - NYC Danger Map

## Overview

This is the Node.js/Express backend server for the NYC Danger Map project. The server provides API endpoints for user authentication, posts, and other features.

## Quick Start

1. **Create `.env` file** (see SETUP.md for template)
2. **Install dependencies**: `npm install`
3. **Start MongoDB** (local or cloud)
4. **Run server**: `npm start`
5. **Test**: Visit `http://localhost:3000/health`

## Documentation

- **SETUP.md** - Detailed setup instructions and project structure
- **TESTING.md** - How to test endpoints and troubleshoot

## Current Status

✅ **Completed (Person B - Carli):**
- Server infrastructure setup
- MongoDB connection
- CORS, logger, and error handling middleware
- Health check endpoint
- Environment variable configuration
- Project folder structure

🚧 **In Progress:**
- Auth system (Person C - Justin)
- Post system (Person D - Tian)

## API Endpoints

### Available Now
- `GET /health` - Server and database health check
- `GET /test` - Test route

### Coming Soon
- `POST /auth/signup` - User registration (Person C)
- `POST /auth/login` - User login (Person C)
- `GET /auth/me` - Get current user (Person C)
- `POST /posts` - Create post (Person D)
- `GET /posts` - Get posts list (Person D)

## Project Structure

```
server/
├── app.js                 # Main entry point
├── config/               # Configuration
│   ├── mongoConnection.js
│   ├── mongoCollections.js
│   └── settings.js       # Environment variables
├── middleware/           # Express middleware
│   ├── logger.js
│   └── errorHandler.js
├── routes/               # API routes
│   ├── index.js         # Route registration
│   ├── health.js
│   ├── test.js
│   ├── users.js         # (temporary)
│   └── posts.js         # (to be implemented)
├── data/                 # Data access layer
├── models/               # Data models
└── controllers/          # Route controllers
```

## Environment Variables

Required `.env` file:
```env
MONGO_SERVER_URL=mongodb://localhost:27017/
MONGO_DATABASE=nyc_danger_map
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

## Team Members

- **Person A (Michelle)**: Frontend
- **Person B (Carli)**: Backend Infrastructure ✅
- **Person C (Justin)**: Auth System 🚧
- **Person D (Tian)**: Post System 🚧



