import { Router } from 'express';
import { createUser, checkUser, updateUser, getUserById } from '../data/users.js';

import { getPostByUser } from '../data/posts.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save to frontendstuff/public/uploads
    cb(null, path.join(__dirname, '../../frontendstuff/public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = Router();

router.get('/', async (req, res) => {
  res.render("home");
});

//account creation
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
  res.render("edit-profile", {
    title: "Edit Profile",
    user: req.session.user
  });
});


router.post("/edit-profile", upload.single('profile_picture'), async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  try {
    const user = req.session.user;

    const {
      username,
      email,
      borough,
      notificationRadius,
      notificationsEnabled,
      hideSensitiveContent
    } = req.body;
    const address = (typeof req.body.address === 'string' && req.body.address.trim())
      ? req.body.address.trim()
      : null;

    let profilePictureUrl = user.profile_picture || null;

    if (req.file) {
      profilePictureUrl = `/public/uploads/${req.file.filename}`;
    }

    const sensitivePref =
      hideSensitiveContent === "on" || hideSensitiveContent === true;

    let location = user.location || null;

    // address → location
    if (address && address.trim()) {
      location = await geocodeAddress(address);

      // NYC check
      if (
        location.longitude < -74.258 || location.longitude > -73.699 ||
        location.latitude < 40.496 || location.latitude > 40.916
      ) {
        throw new Error("Address must be within NYC");
      }
    }

    await updateUser(
      user._id.toString(),
      username,
      email,
      borough,
      profilePictureUrl,
      address,
      location,
      notificationRadius ? Number(notificationRadius) : 1,
      notificationsEnabled === "on",
      sensitivePref
    );
    const updatedUser = await getUserById(user._id.toString());
    req.session.user = updatedUser;

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
router.get('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    let posts = [];
    try {
      posts = await getPostByUser(req.session.user._id.toString());
    } catch (e) {
      // If no posts found, posts remains empty array
    }

    let totalScore = 0;
    posts.forEach(p => {
      if (p.post_score) totalScore += p.post_score;
    });

    const avgScore = posts.length > 0 ? (totalScore / posts.length) : 0;
    const isStarContributor = posts.length >= 3 && avgScore >= 4.3;

    res.render("profile", {
      title: "Your Profile",
      user: req.session.user,
      self: true,
      userScore: avgScore.toFixed(1),
      isStarContributor: isStarContributor
    });
  } catch (error) {
    return res.status(500).render('error', {
      title: 'Error',
      error: 'Error: Failed to load profile'
    });
  }
});
const geocodeAddress = async (address) => {
  const encoded = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'NYC-Danger-Map/1.0' }
  });

  const data = await response.json();
  if (!data.length) throw new Error("Invalid address");

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon)
  };
};


export default router;
