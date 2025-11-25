import userRoutes from './users.js';
import postsRoutes from './posts.js';

const constructorMethod = (app) => {
  app.use('/users', userRoutes);
  app.use('/posts', postsRoutes);

  app.use(/(.*)/, (req, res) => {
    return res.status(404).json({ error: 'Not found' });
  });
};

export default constructorMethod;