import { Router } from 'express';
import {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost,
    getPostByUser,
    getPopularPosts,
    getPostsByLocation,
    ratePost
} from '../data/posts.js';
import commentData from '../data/comments.js';
import helper from '../data/helpers.js';
import * as notificationsData from '../data/notifications.js';

const router = Router();

// GET / (Get all posts)
router.get('/', async (req, res) => {
    try {
        const { latitude, longitude, radius } = req.query;

        if (latitude && longitude) {
            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);
            const rad = radius ? parseFloat(radius) : 0.01;

            if (isNaN(lat) || isNaN(lon)) {
                return res.status(400).json({ error: "Latitude and longitude must be valid numbers" });
            }

            const postList = await getPostsByLocation(lat, lon, rad);
            return res.json(postList);
        }

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

router.get('/:id/comments', async (req, res) => {
    let id;
    try {
        id = helper.AvailableID(req.params.id, 'postId');
    } catch (e) {
        return res.status(400).json({ error: e.toString() });
    }

    try {
        const commentList = await commentData.getAllComments(id);
        res.json(commentList);
    } catch (e) {
        if (typeof e === 'string' && e.includes("not found")) {
            return res.status(404).json({ error: e.toString() });
        }
        console.error(e);
        res.status(500).json({ error: e.toString() });
    }
});

router.post('/:id/rate', async (req, res) => {
    let id;
    try {
        id = helper.AvailableID(req.params.id, 'postId');
    } catch (e) {
        return res.status(400).json({ error: e.toString() });
    }

    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to rate a post.' });
    }

    const { rating } = req.body;

    if (rating === undefined || rating === null) {
        return res.status(400).json({ error: 'Rating is required' });
    }

    try {
        const result = await ratePost(id, req.session.user._id.toString(), rating);
        res.json(result);
    } catch (e) {
        if (typeof e === 'string' && e.includes("not found")) {
            return res.status(404).json({ error: e.toString() });
        }
        console.error(e);
        res.status(500).json({ error: e.toString() });
    }
});

router.get('/:id', async (req, res) => {
    let id;
    try {
        id = helper.AvailableID(req.params.id, 'postId');
    } catch (e) {
        return res.status(400).json({ error: e.toString() });
    }

    try {
        const post = await getPostById(id);
        res.json(post);
    } catch (e) {
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
    let { title, body, photo,latitude, longitude, address, borough, sensitive, anonymous } = postDataBody;
    const userId = req.session.user._id.toString();

    if (sensitive === 'on') sensitive = true;
    else if (sensitive !== true) sensitive = false;

    if (anonymous === 'on') anonymous = true;
    else if (anonymous !== true) anonymous = false;

    // Build location object from latitude/longitude
    let location = null;
    if (latitude && longitude) {
        location = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        };
    }else if (address) {
        locationOrAddress = address;
    } else {
        return res.status(400).json({ error: 'Location (latitude/longitude) or address is required.' });
    }
    // Try to create
    try {
        const newPost = await createPost(title, body, photo, location, borough, sensitive, userId, anonymous);
        try {
            if (newPost.location && newPost.location.latitude && newPost.location.longitude) {
                await notificationsData.notifyNearbyUsers(
                    newPost._id.toString(),
                    newPost.title,
                    newPost.location,
                    userId  // exclude the post creator from notifications
                );
            }
        } catch (notifError) {
            console.error('Failed to send notifications:', notifError);
            // Don't fail the post creation if notifications fail
        }
        if (req.headers['content-type'] === 'application/json') {
            return res.status(201).json(newPost);
        }
        return res.status(201).redirect(`/posts/${newPost._id.toString()}`);
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

// PATCH /:id/sensitive (Admin toggle sensitive status)
router.patch('/:id/sensitive', async (req, res) => {
    let id;
    try {
        id = helper.AvailableID(req.params.id, 'postId');
    } catch (e) {
        return res.status(400).json({ error: e.toString() });
    }

    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in.' });
    }

    // Check if admin
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    try {
        const post = await getPostById(id);
        const newSensitiveStatus = !post.sensitive;

        const updatedPost = await updatePost(id, { sensitive: newSensitiveStatus });
        res.json({ sensitive: updatedPost.sensitive, postId: id });
    } catch (e) {
        if (typeof e === 'string' && e.includes("No post found")) {
            return res.status(404).json({ error: e.toString() });
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


router.post('/:id/comments', async (req, res) => {
    console.log('=== POST /:id/comments route hit ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request path:', req.path);
    console.log('Request url:', req.url);
    console.log('Session user:', req.session.user ? 'exists' : 'missing');

    let id;
    // Check validate ID (400 error)
    try {
        id = helper.AvailableID(req.params.id, 'postId');
    } catch (e) {
        return res.status(400).json({ error: e.toString() });
    }

    // Check if user is logged in
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to comment.' });
    }

    // validate user ID
    if (!req.session.user._id) {
        return res.status(401).json({ error: 'Invalid user session.' });
    }

    let userId;
    try {
        userId = req.session.user._id.toString();
        helper.AvailableID(userId, 'user ID');
    } catch (e) {
        console.error('Invalid user ID in session:', req.session.user._id);
        return res.status(401).json({ error: 'Invalid user session.' });
    }

    const { text, score } = req.body;

    // Check comment text
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Comment text is required and must be a string' });
    }

    try {
        helper.AvailableString(text, 'comment text');
    } catch (e) {
        return res.status(400).json({ error: e.toString() });
    }

    // Check score
    if (score === undefined || score === null) {
        return res.status(400).json({ error: 'Score is required' });
    }

    const scoreNum = Number(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 5) {
        return res.status(400).json({ error: 'Score must be a valid number between 0 and 5' });
    }

    try {
        console.log('Calling createComment...');
        const newComment = await commentData.createComment(id, userId, text, scoreNum);
        console.log('createComment returned:', newComment);
        console.log('Sending response...');
        res.status(201).json(newComment);
        console.log('Response sent successfully');
    } catch (e) {
        console.error('=== ERROR creating comment ===');
        console.error('Error:', e);
        console.error('Error type:', typeof e);
        console.error('Error stack:', e.stack);
        console.error('Post ID:', id);
        console.error('User ID:', userId);
        console.error('Text:', text);
        console.error('Score:', scoreNum);
        if (typeof e === 'string' && (e.includes("No post found") || e.includes("not found"))) {
            return res.status(404).json({ error: e.toString() });
        }
        if (typeof e === 'string' && (e.includes("must be") || e.includes("Invalid"))) {
            return res.status(400).json({ error: e.toString() });
        }
        res.status(500).json({ error: e.toString() || 'Internal server error' });
    }
});


// DELETE /:postId/comments/:commentId (Delete a comment)
router.delete('/:postId/comments/:commentId', async (req, res) => {
    let commentId;
    let postId;
    try {
        postId = helper.AvailableID(req.params.postId, 'postId');
        commentId = helper.AvailableID(req.params.commentId, 'commentId');
    } catch (e) {
        return res.status(400).json({ error: e.toString() });
    }

    // Check if user is logged in
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to delete a comment.' });
    }

    try {
        const comment = await commentData.getCommentById(commentId);

        // Authorization check: User must be the comment owner OR an admin
        const isOwner = comment.user === req.session.user._id.toString();
        const isAdmin = req.session.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'You do not have permission to delete this comment.' });
        }

        const result = await commentData.deleteComment(commentId);
        res.json(result);
    } catch (e) {
        if (typeof e === 'string' && e.includes("not found")) {
            return res.status(404).json({ error: e.toString() });
        }
        console.error(e);
        res.status(500).json({ error: e.toString() });
    }
});

export default router;
