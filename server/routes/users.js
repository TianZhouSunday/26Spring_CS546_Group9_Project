import { Router } from 'express';
import { createUser, checkUser } from '../data/users.js';

const router = Router();

// Account creation
// Following CS546 patterns: async/await, try/catch, proper error handling
router.post('/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // CS546 pattern: validation happens in data layer, but we catch errors here
    const user = await createUser(username, password, email);
    
    // Note: Session handling will be replaced by JWT in Person C's implementation
    // For now, just return the user
    res.json(user);
  } catch (e) {
    // CS546 pattern: return {error: "message"} format with appropriate status code
    const statusCode = e.message && e.message.includes('already') ? 400 : 400;
    res.status(statusCode).json({ error: e.message || e.toString() });
  }
});

// Login
// Following CS546 patterns: async/await, try/catch, proper error handling
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // CS546 pattern: validation happens in data layer
    const user = await checkUser(email, password);
    
    // Note: Session handling will be replaced by JWT in Person C's implementation
    res.json({ message: 'Login successful', user });
  } catch (e) {
    // CS546 pattern: return {error: "message"} format
    res.status(400).json({ error: e.message || e.toString() });
  }
});

// Logout
// Note: This will be replaced by JWT logout in Person C's implementation
router.get('/logout', (req, res) => {
  // Placeholder for now - Person C will implement proper JWT logout
  res.json({ message: 'Logged out' });
});

export default router;
