// app.js
import express from "express";
import session from "express-session";
import exphbs from "express-handlebars";
import constructorMethod from "./routes/index.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { dbConnection } from './config/mongoConnection.js';

const app = express();

const db = await dbConnection();
console.log('MongoDB connected to:', db.databaseName);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(path.join(__dirname, "../frontendstuff/public")));
app.use("/public", express.static(path.join(__dirname, "../frontendstuff/views/layouts"))); // Serve CSS from layouts folder
app.use("/src", express.static(path.join(__dirname, "../frontendstuff/src")));
app.engine('handlebars', exphbs.engine({
  defaultLayout: "main",
  extname: ".handlebars",
  helpers: {
    equals(a, b, options) {
      return a == b ? options.fn(this) : options.inverse(this);
    },
    eq(a, b) {
      return a == b;
    },
    and(a, b) {
      return a && b;
    },
    formatRating(rating) {
      if (!rating && rating !== 0) return '0.0';
      return Number(rating).toFixed(1);
    }
  }
}));
app.set("view engine", "handlebars");
app.set('views', path.join(__dirname, '../frontendstuff/views'));

app.use(express.json());

app.use(session({
  name: 'AuthCookie',
  secret: 'some secret string',
  resave: false,
  saveUninitialized: false
}));


//middlware for redirecting users to/from signin pages
function loginRedirect(req, res, next) {
  if (req.session.user) {
    return res.redirect("/profile");
  }
  next();
}
function registerRedirect(req, res, next) {
  if (req.session.user) {
    return res.redirect("/profile");
  }
  next();
}
function authenticateUser(req, res, next) {
  if (!req.session.user) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'You must be logged in.' });
    }
    return res.redirect("/login");
  }
  next();
}
function signout(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}


app.get("/login", loginRedirect);
app.get("/register", registerRedirect);
app.get("/signout", signout);
// homepage route 
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/map");
  }
  res.render('home', { title: 'Welcome to NYC Danger Map' });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`API Request: ${req.method} ${req.path}`);
    console.log(`  Full URL: ${req.url}`);
    console.log(`  Has session: ${req.session.user ? 'yes' : 'no'}`);
  }
  next();
});







constructorMethod(app);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});




