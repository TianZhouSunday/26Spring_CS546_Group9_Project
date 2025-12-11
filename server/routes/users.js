import { Router } from 'express';
import { createUser, checkUser, updateUser } from '../data/users.js';

const router = Router();

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

// update profile settings
router.post('/profile/settings', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { hideSensitiveContent } = req.body;
    const sensitivePref = hideSensitiveContent === 'on' || hideSensitiveContent === true;

    const user = req.session.user;

    await updateUser(
      user._id.toString(),
      user.username,
      user.phone_number,
      user.email,
      user.age,
      user.home_address,
      user.location,
      user.profile_picture,
      sensitivePref
    );

    // Update session
    req.session.user.hideSensitiveContent = sensitivePref;

    return res.redirect('/profile');
  } catch (e) {
    return res.status(500).render("profile", {
      title: "Your Profile",
      user: req.session.user,
      error: "Failed to update settings"
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