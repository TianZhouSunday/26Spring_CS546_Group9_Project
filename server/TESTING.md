# Testing Guide

## Prerequisites

1. **MongoDB must be running** on your system
   - If you have MongoDB installed locally, start it with: `mongod`
   - Or use MongoDB Atlas (cloud) and update `MONGO_SERVER_URL` in `.env`

2. **Create `.env` file** in the `server/` directory:
   ```bash
   MONGO_SERVER_URL=mongodb://localhost:27017/
   MONGO_DATABASE=nyc_danger_map
   JWT_SECRET=test-secret-key-12345
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3001
   ```

3. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

## Running the Server

Start the server:
```bash
npm start
```

You should see:
```
Server running on http://localhost:3000
Environment: development
```

## Testing Endpoints

### 1. Health Check (Database Connection Test)
```bash
curl http://localhost:3000/health
```

**Expected Response (if MongoDB is connected):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-11-10T..."
}
```

**Expected Response (if MongoDB is NOT connected):**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "...",
  "timestamp": "2024-11-10T..."
}
```

### 2. Test Route
```bash
curl http://localhost:3000/test
```

**Expected Response:**
```json
{
  "message": "Test route successful"
}
```

### 3. Test 404 Handler
```bash
curl http://localhost:3000/nonexistent
```

**Expected Response:**
```json
{
  "error": "Not found"
}
```

## Using Postman or Browser

1. **Health Check**: Open `http://localhost:3000/health` in your browser
2. **Test Route**: Open `http://localhost:3000/test` in your browser

## Checking Logs

The logger middleware will output all requests to the console:
```
[2024-11-10T12:00:00.000Z] GET /health - IP: ::1
[2024-11-10T12:00:01.000Z] GET /test - IP: ::1
```

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Make sure all dependencies are installed: `npm install`

### Database connection fails
- Verify MongoDB is running: `mongod` or check MongoDB service
- Check `MONGO_SERVER_URL` in `.env` file
- Try connecting with MongoDB Compass or `mongosh` to verify connection

### Module not found errors
- Run `npm install` again
- Make sure you're in the `server/` directory



