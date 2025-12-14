// help from my lab 8 code 
import express from 'express';
import { createUser, checkUser, getUserById } from '../data/users.js';
import { getAllPosts, getPostById, createPost, deletePost } from '../data/posts.js';
import commentData from '../data/comments.js';
import helper from '../data/helpers.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file upload (Same as auth_routes.js)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../frontendstuff/public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = express.Router();

// home site
router.route('/').get(async (req, res) => {
  if (req.session.user) {
    return res.redirect('/posts');
  }
  res.render('home', {
    title: 'NYC Danger Map: WS Group 9 Final Project'
  });
});

// login page
router.route('/login').get(async (req, res) => {
  if (req.session.user) {
    return res.redirect('/posts');
  }
  res.render('login', {
    title: 'Login'
  });
});

// login submit
router.route('/login').post(async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  if (!email || !password) {
    return res.status(400).render('login', {
      title: 'Error',
      error: 'Error: Email and password are required'
    });
  }

  try {
    let user = await checkUser(email.trim(), password.trim());
    req.session.user = user;
    res.redirect('/posts');
  } catch (error) {
    return res.status(400).render('login', {
      title: 'Login',
      error: 'Error: User does not exist'
    });
  }
});

// signup page
router.route('/signup').get(async (req, res) => {
  if (req.session.user) {
    return res.redirect('/posts');
  }
  res.render('signup', {
    title: 'Sign Up'
  });
});

// signup submit
router.route('/signup').post(async (req, res) => {
  let username = req.body.username;
  let email = req.body.email;
  let password = req.body.password;

  if (!username || !email || !password) {
    return res.status(400).render('signup', {
      title: 'Error',
      error: 'Error: All fields are required, try again'
    });
  }

  try {
    let user = await createUser(username.trim(), password.trim(), email.trim());
    req.session.user = user;
    res.redirect('/posts');
  } catch (error) {
    return res.status(400).render('signup', {
      title: 'Error',
      error: 'Error: Failed to create user'
    });
  }
});

// logout
router.route('/logout').post(async (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// map page
router.route('/map').get(async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('map', {
    title: 'NYC Danger Map',
    user: req.session.user
  });
});

// all posts page
router.route('/posts').get(async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const filter = {};
    if (req.query.borough) filter.borough = req.query.borough;
    if (req.query.rating) filter.minScore = req.query.rating;

    let postList = await getAllPosts(filter);

    //filter out posts made by blocked users and posts earlier than a week old
    const blockedUsers = (req.session.user.blocked_users || []).map(String);
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    postList = postList.filter(post => {
      const postDate = new Date(post.date).getTime();

      return (
        postDate >= oneWeekAgo &&
        !blockedUsers.includes(post.user.toString())
      );
    });

    res.render('posts', {
      title: 'Community Posts',
      posts: postList,
      user: req.session.user,
      selectedBorough: req.query.borough,
      selectedRating: req.query.rating
    });
  } catch (error) {
    return res.status(500).render('error', {
      title: 'Error',
      error: 'Error: Failed to load posts'
    });
  }
});

router.route('/posts/archive').get(async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    let postList = await getAllPosts();

    //filter out posts made by blocked users and posts from the last week
    const blockedUsers = (req.session.user.blocked_users || []).map(String);
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    postList = postList.filter(post => {
      const postDate = new Date(post.date).getTime();

      return (
        postDate < oneWeekAgo &&
        !blockedUsers.includes(post.user.toString())
      );
    });

    res.render('posts', {
      title: 'Posts Archive',
      posts: postList
    });
  } catch (error) {
    return res.status(500).render('error', {
      title: 'Error',
      error: 'Error: Failed to load post archive.'
    });
  }
});

// create post
router.route('/posts').post(upload.single('photo'), async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  let title = req.body.title ? req.body.title.trim() : "";
  let body = req.body.body ? req.body.body.trim() : "";

  // Handle photo: file upload > URL input
  let photo = "";
  if (req.file) {
    photo = `/public/uploads/${req.file.filename}`;
  } else if (req.body.photo) {
    photo = req.body.photo.trim();
  }

  let longitude = req.body.longitude;
  let latitude = req.body.latitude;
  let sensitive = req.body.sensitive;
  let borough = req.body.borough;
  let anonymous = (req.body.anonymous === 'on');

  if (!title || !longitude || !latitude) {
    try {
      let postList = await getAllPosts();
      return res.status(400).render('posts', {
        title: 'Posts',
        posts: postList,
        error: 'Error: Title and location are required'
      });
    } catch (error) {
      return res.status(500).render('error', {
        title: 'Error',
        error: 'Error: An error occurred'
      });
    }
  }

  let location = {
    longitude: parseFloat(longitude),
    latitude: parseFloat(latitude)
  };

  let isSensitive = (sensitive === 'true' || sensitive === 'on');
  let userId = req.session.user._id.toString();

  try {
    await createPost(title, body, photo, location, borough, isSensitive, userId, anonymous);
    // Redirect logic: if created from map (which typically might be referred), 
    // we could check referer, but for now redirecting to posts list is standard behavior in this app
    res.redirect('/posts');
  } catch (error) {
    let postList = await getAllPosts();
    return res.status(400).render('posts', {
      title: 'Posts',
      posts: postList,
      error: 'Error: Could not create post'
    });
  }
});

// single post page
router.route('/posts/:id').get(async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  let id = req.params.id;

  try {
    helper.AvailableID(id, 'postId');
  } catch (error) {
    return res.status(400).render('error', {
      title: 'Error',
      error: 'Error: Invalid post ID'
    });
  }

  try {
    let post = await getPostById(id);
    let comments = await commentData.getAllComments(id);

    let user = await getUserById(post.user);

    res.render('post', {
      title: post.title,
      post: post,
      comments: comments,
      user: user,
      currentUser: req.session.user
    });
  } catch (error) {
    return res.status(404).render('error', {
      title: 'Error',
      error: 'Error: Post not found'
    });
  }
});

// delete posts (from posts)
router.route('/posts/:id/delete').post(async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  let id = req.params.id;

  try {
    let post = await getPostById(id);

    let isOwner = (post.user.toString() === req.session.user._id.toString());
    let isAdmin = (req.session.user.role === 'admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).render('error', {
        title: 'Error',
        error: 'Error: You do not have permission to delete this post'
      });
    }

    await deletePost(id);
    res.redirect('/posts');
  } catch (error) {
    return res.status(404).render('error', {
      title: 'Error',
      error: 'Error: Post not found'
    });
  }
});

// add comment
router.route('/posts/:id/comment').post(async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  let id = req.params.id;
  let text = req.body.text;
  let score = req.body.score; // Expect score from form

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    try {
      let post = await getPostById(id);
      let user = await getUserById(post.user);
      return res.status(400).render('post', {
        title: post.title,
        post: post,
        user: user,
        currentUser: req.session.user,
        error: "Comment cannot be empty"
      });
    } catch (e) {
      return res.status(404).render('error', { error: 'Post not found' });
    }
  }

  // Default score to 3 if missing (or handle validation)
  let scoreNum = 3;
  if (score) {
    scoreNum = parseInt(score);
  }

  try {
    text = text.trim();
    await commentData.createComment(id, req.session.user._id.toString(), text, scoreNum);
    res.redirect(`/posts/${id}`);
  } catch (error) {
    try {
      let post = await getPostById(id);
      let user = await getUserById(post.user);
      res.status(500).render('post', {
        title: post.title,
        post: post,
        user: user,
        currentUser: req.session.user,
        error: "Failed to add comment: " + error.message
      });
    } catch (e) {
      res.status(404).render('error', { error: 'Post not found' });
    }
  }
});

export default router;