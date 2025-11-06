// app.js
import express from 'express';
import { dbConnection } from './config/mongoConnection.js';
import constructorMethod from './routes/index.js';

const app = express();


app.use(express.json());

constructorMethod(app);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});