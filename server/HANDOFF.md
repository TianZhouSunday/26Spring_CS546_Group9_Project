# handoff doc from Carli

## done

### infrastructure 
- Express server configured and running
- MongoDB connection setup
- Environment variable configuration (.env support)
- CORS middleware for frontend communication
- Request logger middleware
- Unified error handler (returns `{error: "message"}`)
- Health check endpoint (`GET /health`)
- Test endpoint (`GET /test`)
- Project folder structure (routes/, middleware/, models/, controllers/)

### the files that I did 
- `middleware/logger.js` - Logs all requests
- `middleware/errorHandler.js` - Handles all errors uniformly
- `routes/health.js` - Health check endpoint
- `config/settings.js` - Updated to use .env variables

### Documentation Created
- `README.md` - Overview and quick reference
- `SETUP.md` - Detailed setup instructions
- `TESTING.md` - How to test the server
- `QUICK_START.md` - Quick reference for you and teammates
- `HANDOFF.md` - This file

## How to Test Your Work

### Step 1: Create `.env` file
Create `server/.env`:
```env
MONGO_SERVER_URL=mongodb://localhost:27017/
MONGO_DATABASE=nyc_danger_map
JWT_SECRET=test-secret-key-12345
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

### Step 2: Install Dependencies
```bash
cd server
npm install
```

### Step 3: Start MongoDB
Make sure MongoDB is running on your system.

### Step 4: Start Server
```bash
npm start
```

You should see:
```
Server running on http://localhost:3000
Environment: development
```

### Step 5: Test Endpoints

**Option A: Browser**
- Open: `http://localhost:3000/health`
- Open: `http://localhost:3000/test`

**Option B: Terminal**
```bash
curl http://localhost:3000/health
curl http://localhost:3000/test
```

**Option C: Test Script**
```bash
./test-server.sh
```

## What Your Teammates Need to Know

### For Person C (Justin - Auth System)

**Location of JWT Secret:**
```javascript
import { jwtSecret } from '../config/settings.js';
```

**Where to create files:**
- `middleware/auth.js` - JWT authentication middleware
- `routes/auth.js` - Auth routes (signup, login, /me)

**How to integrate:**
1. Create the files above
2. In `routes/index.js`, uncomment:
   ```javascript
   import authRoutes from './auth.js';
   app.use('/auth', authRoutes);
   ```

**Error handling:**
Just throw errors normally - the error handler will format them:
```javascript
throw new Error('Invalid credentials');
// Returns: {error: "Invalid credentials"}
```

### For Person D (Tian - Post System)

**Database access:**
```javascript
import { posts } from '../config/mongoCollections.js';
const postCollection = await posts();
```

**Where to add routes:**
- `routes/posts.js` - Already exists, just add your routes

**How to integrate:**
1. Add routes to `routes/posts.js`
2. In `routes/index.js`, uncomment:
   ```javascript
   import postRoutes from './posts.js';
   app.use('/posts', postRoutes);
   ```

**Using auth middleware (from Person C):**
```javascript
import authMiddleware from '../middleware/auth.js';
router.post('/', authMiddleware, async (req, res, next) => {
  // req.user.id is available here
});
```

## Project Structure

```
server/
├── app.js                 # Main entry - all middleware registered here
├── config/
│   ├── mongoConnection.js # Database connection
│   ├── mongoCollections.js # Collection accessors
│   └── settings.js        # Environment variables (JWT secret here!)
├── middleware/
│   ├── logger.js         # Request logging
│   └── errorHandler.js   # Error formatting
├── routes/
│   ├── index.js          # Route registration (uncomment routes here)
│   ├── health.js         # Health check
│   ├── test.js           # Test route
│   ├── users.js          # (temporary - Person C will replace)
│   └── posts.js          # (Person D will implement)
├── data/                 # Data access layer (existing)
├── models/               # (for future use)
└── controllers/          # (for future use)
```

## Key Features

### Error Handling
All errors automatically return: `{error: "message"}`
```javascript
// In your routes, just throw:
throw new Error('Something went wrong');
// Error handler formats it automatically
```

### Request Logging
All requests are logged to console:
```
[2024-11-10T12:00:00.000Z] GET /health - IP: ::1
```

### CORS
Already configured for frontend at `http://localhost:3001`
(Change `FRONTEND_URL` in `.env` if different)

### Environment Variables
All sensitive data in `.env`:
- MongoDB connection
- JWT secret
- Port
- Frontend URL

## Troubleshooting

**Server won't start:**
- Check if port 3000 is in use
- Make sure `.env` file exists
- Run `npm install`

**Database connection fails:**
- Verify MongoDB is running
- Check `MONGO_SERVER_URL` in `.env`

**Routes return 404:**
- Check `routes/index.js` - routes must be registered there
- Check server logs for the request path

## Next Steps for Team

1. **Person C (Justin)**: Implement auth system
   - Create `middleware/auth.js`
   - Create `routes/auth.js`
   - Uncomment auth routes in `routes/index.js`

2. **Person D (Tian)**: Implement post system
   - Add routes to `routes/posts.js`
   - Uncomment post routes in `routes/index.js`

3. **Person A (Michelle)**: Connect frontend
   - Use `http://localhost:3000` as API base URL
   - CORS is already configured

## Questions?

Check the documentation files:
- `README.md` - Overview
- `SETUP.md` - Detailed setup
- `TESTING.md` - Testing guide
- `QUICK_START.md` - Quick reference



