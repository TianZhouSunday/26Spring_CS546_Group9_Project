# Server Setup Guide

## Quick Start

1. **Create `.env` file** in the `server/` directory (copy from below)
2. **Install dependencies**: `npm install`
3. **Start MongoDB** (if using local MongoDB)
4. **Start server**: `npm start`
5. **Test**: Open `http://localhost:3000/health` in browser

## Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```env
MONGO_SERVER_URL=mongodb://localhost:27017/
MONGO_DATABASE=nyc_danger_map
JWT_SECRET=your-secret-key-change-this-in-production
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

**Important**: The `.env` file is gitignored, so each team member needs to create their own.

## Installation

1. Install dependencies:
```bash
cd server
npm install
```

2. Make sure MongoDB is running on your system
   - Local: Start with `mongod` command
   - Cloud: Use MongoDB Atlas and update `MONGO_SERVER_URL` in `.env`

3. Start the server:
```bash
npm start
```

4. Verify it's working:
   - Open `http://localhost:3000/health` in browser
   - Should see: `{"status":"healthy","database":"connected",...}`

## Project Structure

```
server/
├── app.js                 # Main application entry point
├── config/               # Configuration files
│   ├── mongoConnection.js
│   ├── mongoCollections.js
│   └── settings.js       # Environment variable configuration
├── middleware/           # Express middleware
│   ├── logger.js         # Request logging
│   └── errorHandler.js   # Unified error handling
├── routes/               # API routes
│   ├── index.js          # Route registration
│   ├── health.js         # Health check endpoint
│   ├── test.js           # Test route
│   ├── users.js          # User routes (temporary)
│   └── posts.js          # Post routes (to be implemented by Person D)
├── data/                 # Data access layer
│   ├── users.js
│   ├── posts.js
│   └── helpers.js
├── models/               # Data models (for future use)
└── controllers/          # Route controllers (for future use)
```

## API Endpoints

- `GET /health` - Server and database health check
- `GET /test` - Test route to verify server is running
- `POST /users/signup` - User signup (temporary - will be replaced by Person C)
- `POST /users/login` - User login (temporary - will be replaced by Person C)

## Middleware

- **CORS**: Enabled for frontend communication
- **Logger**: Logs all incoming requests with timestamp, method, URL, and IP
- **Error Handler**: Unified error response format: `{error: "message"}`

## For Team Members

### Person C (Justin) - Auth System

**What's already set up for you:**
- JWT secret is available in `config/settings.js` as `jwtSecret` (import it: `import { jwtSecret } from '../config/settings.js'`)
- Database connection is ready via `config/mongoConnection.js`
- User collection is available via `config/mongoCollections.js` → `users()`
- Error handler will automatically format your errors as `{error: "message"}`
- CORS is already configured

**What you need to do:**
1. Create `middleware/auth.js` for JWT authentication middleware
   - Parse `Authorization: Bearer <token>` header
   - Verify token and attach `req.user = {id, email, nickname}` to request
   - Return 401 if invalid

2. Create `routes/auth.js` with:
   - `POST /auth/signup` - validate, hash password, create user
   - `POST /auth/login` - check password, return JWT token
   - `GET /auth/me` - use auth middleware, return current user

3. Update `routes/index.js`:
   - Uncomment: `import authRoutes from './auth.js';`
   - Uncomment: `app.use('/auth', authRoutes);`
   - You can remove or comment out the old `/users` routes

**Example route structure:**
```javascript
// routes/auth.js
import { Router } from 'express';
import { jwtSecret } from '../config/settings.js';
// ... your auth logic

const router = Router();
router.post('/signup', async (req, res, next) => {
  try {
    // your signup logic
    res.json({ user, token });
  } catch (error) {
    next(error); // Error handler will format it
  }
});
```

### Person D (Tian) - Post System

**What's already set up for you:**
- Database connection is ready
- Post collection is available via `config/mongoCollections.js` → `posts()`
- Error handler will automatically format your errors
- CORS is already configured

**What you need to do:**
1. Update `routes/posts.js` (currently empty) with:
   - `POST /posts` - require auth middleware, create post
   - `GET /posts` - return recent posts (desc by time)
   - `GET /posts/mine` - (optional) user's own posts

2. Update `routes/index.js`:
   - Uncomment: `import postRoutes from './posts.js';`
   - Uncomment: `app.use('/posts', postRoutes);`

**Example route structure:**
```javascript
// routes/posts.js
import { Router } from 'express';
import authMiddleware from '../middleware/auth.js'; // from Person C
// ... your post logic

const router = Router();
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    // req.user.id is available from auth middleware
    // your create post logic
    res.json(post);
  } catch (error) {
    next(error); // Error handler will format it
  }
});
```

## Testing

See `TESTING.md` for detailed testing instructions.

Quick test:
```bash
# Health check
curl http://localhost:3000/health

# Test route
curl http://localhost:3000/test
```

