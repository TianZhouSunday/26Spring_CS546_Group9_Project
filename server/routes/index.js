import userRoutes from './users.js';
import postsRoutes from './posts.js';
import reportsRoutes from './reports.js';
import testRoute from './test.js';

const constructorMethod = (app) => {
  app.use('/test', testRoute);
  app.use('/', userRoutes);
  app.use('/posts', postsRoutes);
  app.use('/reports', reportsRoutes);

  app.use(/(.*)/, (req, res) => {
    return res.status(404).json({ error: 'Not found' });
  });
};

export default constructorMethod;