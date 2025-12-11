import authRoutes from './auth_routes.js';
import postsRoutes from './posts.js';
import reportsRoutes from './reports.js';
import testRoute from './test.js';
import userRoutes from './user_routes.js';

const constructorMethod = (app) => {
  app.use('/test', testRoute);
  app.use('/', authRoutes);
  app.use('/user', userRoutes);
  app.use('/posts', postsRoutes);
  app.use('/reports', reportsRoutes);

  app.use(/(.*)/, (req, res) => {
    return res.status(404).json({ error: 'Not found' });
  });
};

export default constructorMethod;