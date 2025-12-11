// help from my lab 8 code 
import express from 'express';
import { createUser, checkUser } from '../data/users.js';
import { getAllPosts, getPostById, createPost, deletePost } from '../data/posts.js';
import helper from '../data/helpers.js';

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

// all posts page
router.route('/posts').get(async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    let postList = await getAllPosts();
    res.render('posts', {
      title: 'Posts',
      posts: postList
    });
  } catch (error) {
    return res.status(500).render('error', {
      title: 'Error',
      error: 'Error: Failed to load posts'
    });
  }
});

// create post
router.route('/posts').post(async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  let title = req.body.title.trim();
  let body = req.body.body.trim();
  let photo = req.body.photo.trim();
  // trim all inputs 
  let longitude = req.body.longitude;
  let latitude = req.body.latitude;
  let sensitive = req.body.sensitive;

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
    await createPost(title, body, photo, location, isSensitive, userId);
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
    let comments = []; // comments
    
    res.render('post', {
      title: post.title,
      post: post,
      comments: comments
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

export default router;