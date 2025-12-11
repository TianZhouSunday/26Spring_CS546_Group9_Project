import authRoutes from './auth_routes.js';
import postsRoutes from './posts.js';
import testRoute from './test.js';
import userRoutes from './users.js';

const constructorMethod = (app) => {
  app.use('/test', testRoute);
  app.use('/', authRoutes);
  app.use('/user', userRoutes);
  app.use('/posts', postsRoutes);

  app.use(/(.*)/, (req, res) => {
    return res.status(404).json({ error: 'Not found' });
  });
};

export default constructorMethod;