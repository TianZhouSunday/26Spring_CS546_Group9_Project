import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Test route successful' });
});

export default router;

