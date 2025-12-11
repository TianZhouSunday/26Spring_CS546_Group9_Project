// app.js
import express from 'express';
import exphbs from 'express-handlebars';
import session from 'express-session';
import { dbConnection } from './config/mongoConnection.js';
import constructorMethod from './routes/index.js';

const app = express();

app.engine('handlebars', exphbs.engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(express.json());

app.use(session({
  name: 'AuthCookie',
  secret: 'some secret string',
  resave: false,
  saveUninitialized: false
}));

constructorMethod(app);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});