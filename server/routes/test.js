import { Router } from 'express';

const router = Router();

// GET /test - Test route to verify server is running
// Following CS546 patterns: simple route returning JSON
router.get('/', (req, res) => {
  // CS546 pattern: return JSON with res.json()
  res.json({ message: 'Test route successful' });
});

export default router;