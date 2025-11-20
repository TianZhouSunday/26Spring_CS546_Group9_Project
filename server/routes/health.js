import { Router } from 'express';
import { dbConnection } from '../config/mongoConnection.js';

const router = Router();

// GET /health - Check server and database status
// Following CS546 patterns: async/await, try/catch, proper error handling
router.get('/', async (req, res) => {
  try {
    // Try to connect to database
    const db = await dbConnection();
    await db.admin().ping();
    
    // CS546 pattern: return JSON with res.json()
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // CS546 pattern: return {error: "message"} format with appropriate status code
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message || 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;


