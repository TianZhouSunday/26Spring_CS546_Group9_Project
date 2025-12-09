import { Router } from 'express';
import {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost,
    getPostByUser,
    getPopularPosts
} from '../data/posts.js';
import helper from '../data/helpers.js';

const router = Router();

// GET / (Get all posts)
router.get('/', async (req, res) => {
    try {
        const postList = await getAllPosts();
        res.json(postList);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.toString() });
    }
});

// GET /popular (Get popular posts)
router.get('/popular', async (req, res) => {
    try {
        const postList = await getPopularPosts();
        res.json(postList);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.toString() });
    }
});

// GET /user/:userId (Get all posts for a specific user)
router.get('/user/:userId', async (req, res) => {
    let userId;
    // Check validate ID format
    try {
        userId = helper.AvailableID(req.params.userId, 'userId');
    } catch (e) {
        return res.status(400).json({ error: e.toString() });
    }

    // Try to fetch from database
    try {
        const postList = await getPostByUser(userId);
        res.json(postList);
    } catch (e) {
        // Check if it's a 404 error
        if (typeof e === 'string' && e.includes("not found")) {
            return res.status(404).json({ error: e.toString() });
        }
        console.error(e);
        res.status(500).json({ error: e.toString() });
    }
});

// GET /:id (Get a single post)
router.get('/:id', async (req, res) => {
    let id;
    // Check validate ID format
    try {
        id = helper.AvailableID(req.params.id, 'postId');
    } catch (e) {
        return res.status(400).json({ error: e.toString() });
    }

    // Try to fetch from database
    try {
        const post = await getPostById(id);
        res.json(post);
    } catch (e) {
        // Error classification
        if (typeof e === 'string' && e.includes("No post found")) {
            return res.status(404).json({ error: e.toString() });
        }
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST / (Create a new post)
router.post('/', async (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to create a post.' });
    }

    const postDataBody = req.body;

    // Check req.body (400 error)
    if (!postDataBody || Object.keys(postDataBody).length === 0) {
        return res.status(400).json({ error: 'Request body must not be empty.' });
    }
    const { title, body, photo, location, sensitive } = postDataBody;
    const userId = req.session.user._id.toString();

    // Try to create
    try {
        const newPost = await createPost(title, body, photo, location, sensitive, userId);
        res.status(201).json(newPost);
    } catch (e) {
        // Error classification
        if (typeof e === 'string' && (e.includes("must be") || e.includes("length must"))) {
            return res.status(400).json({ error: e.toString() });
        }
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// PATCH /:id (Update post)
router.patch('/:id', async (req, res) => {
    const updatedData = req.body;
    let id;

    // Check validate ID (400 error)
    try {
        id = helper.AvailableID(req.params.id, 'postId');
    } catch (e) {
        return res.status(400).json({ error: e.toString() });
    }

    // Check validate Body (400 error)
    if (!updatedData || Object.keys(updatedData).length === 0) {
        return res.status(400).json({ error: 'Request body must contain fields to update.' });
    }

    // Check if user is logged in
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to update a post.' });
    }

    // Authorization check
    try {
        const post = await getPostById(id);
        if (post.user.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ error: 'You do not have permission to update this post.' });
        }
    } catch (e) {
        return res.status(404).json({ error: 'Post not found' });
    }


    // Try to update
    try {
        const updatedPost = await updatePost(id, updatedData);
        res.json(updatedPost);
    } catch (e) {
        // Error classification
        if (typeof e === 'string' && e.includes("No post found")) {
            return res.status(404).json({ error: e.toString() });
        }
        if (typeof e === 'string' && (e.includes("must be") || e.includes("length must") || e.includes("No valid fields"))) {
            return res.status(400).json({ error: e.toString() });
        }
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// DELETE /:id (Delete post)
router.delete('/:id', async (req, res) => {
    let id;
    // Check validate ID (400 error)
    try {
        id = helper.AvailableID(req.params.id, 'postId');
    } catch (e) {
        return res.status(400).json({ error: e.toString() });
    }

    // Check if user is logged in
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to delete a post.' });
    }

    // Authorization check: allow post owner OR admin
    let post; // Define post here to reuse it
    try {
        post = await getPostById(id);
        const isOwner = post.user.toString() === req.session.user._id.toString();
        const isAdmin = req.session.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'You do not have permission to delete this post.' });
        }
    } catch (e) {
        return res.status(404).json({ error: 'Post not found' });
    }

    // Try to delete
    try {
        //Delete all associated comments
        if (post.comments && post.comments.length > 0) {
            // await commentData.deleteAllCommentsForPost(id); 
            console.log(`Deleted ${post.comments.length} associated comments.`);
        }
        //Delete all associated reports
        if (post.reports && post.reports.length > 0) {
            // await reportData.deleteAllReportsForPost(id);
            console.log(`Deleted ${post.reports.length} associated reports.`);
        }

        //Delete the post itself
        const result = await deletePost(id);
        res.json({ deleted: result.deleted, postId: result.postId });

    } catch (e) {
        // Error classification
        if (typeof e === 'string' && (e.includes("Could not delete") || e.includes("not found"))) {
            return res.status(404).json({ error: e.toString() });
        }
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
