// app.js
import express from "express";
import session from "express-session";
import exphbs from "express-handlebars";
import constructorMethod from "./routes/index.js";
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("../frontendstuff/src", express.static("public"));
app.engine('handlebars', exphbs.engine({
  defaultLayout: "main",
  extname: ".handlebars",
  helpers: {
    equals(a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    },
    // check if both conditions are true, e.g. sensitivity of post and user preference
    and(a, b) {
      return a && b;
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
    return res.redirect("/");
  }
  next();
}
function registerRedirect(req, res, next) {
  if (req.session.user) {
    return res.redirect("/");
  }
  next();
}
function authenticateUser(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}
function signout(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}


app.get("/login", loginRedirect);
app.get("/register", registerRedirect);
app.get("/", authenticateUser);
app.get("/signout", signout);







constructorMethod(app);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});




