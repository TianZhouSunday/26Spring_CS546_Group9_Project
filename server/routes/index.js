import userRoutes from './users.js';
import postsRoutes from './posts.js';
import testRoute from './test.js';

const constructorMethod = (app) => {
  app.use('/test', testRoute);
  app.use('/users', userRoutes);
  app.use('/posts', postsRoutes);

  app.use(/(.*)/, (req, res) => {
    return res.status(404).json({ error: 'Not found' });
  });
};

export default constructorMethod;