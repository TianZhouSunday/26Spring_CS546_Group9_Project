import { Router } from 'express';
import { createUser, checkUser } from '../data/users.js';

const router = Router();

//accoutn creation
router.post('/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const user = await createUser(username, password, email);
    req.session.user = user;
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

//login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await checkUser(email, password);
    req.session.user = user;
    res.json({ message: 'Login successful', user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(); 
  res.send('Logged out');  
});

export default router;
