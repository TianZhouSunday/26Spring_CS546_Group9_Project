# Quick Start Guide

## For You (Person B - Carli)

### To Test Your Work:

1. **Create `.env` file** in `server/` folder:
   ```env
   MONGO_SERVER_URL=mongodb://localhost:27017/
   MONGO_DATABASE=nyc_danger_map
   JWT_SECRET=test-secret-123
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3001
   ```

2. **Make sure MongoDB is running**:
   ```bash
   # Check if MongoDB is running
   mongosh --eval "db.version()"
   # If not running, start it (varies by system)
   ```

3. **Install and run**:
   ```bash
   cd server
   npm install
   npm start
   ```

4. **Test in browser**:
   - Open: `http://localhost:3000/health`
   - Should show: `{"status":"healthy","database":"connected",...}`
   - Open: `http://localhost:3000/test`
   - Should show: `{"message":"Test route successful"}`

5. **Or use the test script**:
   ```bash
   # In a new terminal (keep server running)
   ./test-server.sh
   ```

## For Your Teammates

### Person C (Justin) - What You Need to Know:

**Files you'll work with:**
- `routes/auth.js` - Create this file
- `middleware/auth.js` - Create this file  
- `routes/index.js` - Uncomment the auth route lines

**What's ready for you:**
- ✅ JWT secret: `import { jwtSecret } from '../config/settings.js'`
- ✅ Database: `import { users } from '../config/mongoCollections.js'`
- ✅ Error handling: Just `throw new Error('message')` and it auto-formats
- ✅ CORS: Already configured

**Example:**
```javascript
// routes/auth.js
import { Router } from 'express';
import { jwtSecret } from '../config/settings.js';
import jwt from 'jsonwebtoken'; // npm install jsonwebtoken

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    // your login logic
    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.json({ token, user });
  } catch (error) {
    next(error); // Auto-formatted by error handler
  }
});

export default router;
```

### Person D (Tian) - What You Need to Know:

**Files you'll work with:**
- `routes/posts.js` - Already exists, just add your routes
- `routes/index.js` - Uncomment the posts route lines

**What's ready for you:**
- ✅ Database: `import { posts } from '../config/mongoCollections.js'`
- ✅ Error handling: Just `throw new Error('message')` and it auto-formats
- ✅ CORS: Already configured
- ✅ Auth middleware: Will be available from Person C as `authMiddleware`

**Example:**
```javascript
// routes/posts.js
import { Router } from 'express';
import { posts } from '../config/mongoCollections.js';
import authMiddleware from '../middleware/auth.js'; // from Person C

const router = Router();

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const postCollection = await posts();
    const newPost = {
      title: req.body.title,
      author: req.user.id, // from auth middleware
      // ... rest of post
    };
    const result = await postCollection.insertOne(newPost);
    res.json(result);
  } catch (error) {
    next(error); // Auto-formatted
  }
});

export default router;
```

## Common Issues

**"Cannot find module" errors:**
- Run `npm install` in the `server/` folder

**"MongoDB connection failed":**
- Make sure MongoDB is running
- Check `MONGO_SERVER_URL` in `.env`

**"Port already in use":**
- Change `PORT` in `.env` to a different number (e.g., 3001)

**Routes return 404:**
- Check `routes/index.js` - make sure routes are registered
- Check server logs for the request path



