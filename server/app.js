import express from "express";
import session from "express-session";
import exphbs from "express-handlebars";
import configureRoutes from "./routes/index.js";

const app = express();

app.use(express.json());

constructorMethod(app);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});