import { Router } from 'express';
import { createUser, checkUser, updateUser } from '../data/users.js';

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
    const { username, password, email, hideSensitiveContent } = req.body;
    // check sensitive option
    const sensitivePref = hideSensitiveContent === 'on' || hideSensitiveContent === true;

    const user = await createUser(username, password, email, sensitivePref);
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

// edit profile/settings
router.get("/edit-profile", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  return res.render("edit-profile", {
    title: "Edit Profile",
    user: req.session.user
  });
});

router.post("/edit-profile", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {
    const user = req.session.user;

    const {
      username,
      email,
      borough,
      profile_picture,
      hideSensitiveContent
    } = req.body;

    const sensitivePref =
      hideSensitiveContent === "on" || hideSensitiveContent === true;

    await updateUser(
      user._id.toString(),
      username,
      email,
      borough,
      profile_picture || null,
      sensitivePref
    );

    req.session.user.username = username.trim().toLowerCase();
    req.session.user.email = email.trim().toLowerCase();
    req.session.user.borough = borough;
    req.session.user.profile_picture = profile_picture || null;
    req.session.user.hideSensitiveContent = sensitivePref;

    return res.redirect("/profile");

  } catch (e) {
    return res.status(400).render("edit-profile", {
      title: "Edit Profile",
      user: req.session.user,
      error: e.message
    });
  }
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