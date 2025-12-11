import { Router } from 'express';
import { createUser, checkUser } from '../data/users.js';

const router = Router();

router.get('/', async (req, res) => {
  res.render("home");
});

//accoutn creation
router.get('/signup', async (req, res) => {
  if (req.session.user) {
    return res.redirect("/profile");
  }
  res.render("signup", { title: "Sign Up" });
});

//signup submit route 
router.post('/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const user = await createUser(username, password, email);
    req.session.user = user;
    return res.redirect("/profile");
  } catch (e) {
    return res.status(400).render("signup", {
      title: "Sign Up",
      error: e.message
    });
  }
});

//login
router.get('/login', async (req, res) => {
  if (req.session.user) {
    return res.redirect("/profile");
  }
  res.render("login", { title: "Login" });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await checkUser(email, password);
    req.session.user = user;
    return res.redirect("/profile");
  } catch (e) {
    return res.status(400).render("login", {
      title: "Login",
      error: e.message
    });
  }
});

//logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    return res.redirect('/login');
  });
});

//profile
router.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render("profile", {
    title: "Your Profile",
    user: req.session.user
  });
});

export default router;