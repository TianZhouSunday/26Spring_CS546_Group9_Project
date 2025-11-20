// routes/index.js
// Following CS546 pattern: This file "glues" all route files together
import testRoute from './test.js';
import userRoutes from './users.js';
import healthRoute from './health.js';
// Import routes that will be created by Person C and Person D
// import authRoutes from './auth.js'; // Person C will create this
// import postRoutes from './posts.js'; // Person D will create this

// CS546 pattern: constructorMethod function that takes app and registers all routes
const constructorMethod = (app) => {
  // Health check route
  app.use('/health', healthRoute);
  
  // Test route
  app.use('/test', testRoute);
  
  // User routes (temporary - Person C will replace with /auth routes)
  app.use('/users', userRoutes);
  
  // Auth routes (Person C will implement)
  // app.use('/auth', authRoutes);
  
  // Post routes (Person D will implement)
  // app.use('/posts', postRoutes);
  
  // CS546 pattern: 404 handler for unmatched routes
  // Must be last route registered
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
};

export default constructorMethod;