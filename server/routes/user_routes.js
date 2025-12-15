import { Router } from 'express';
import { getUserById, blockUser, unblockUser } from '../data/users.js';
import { getPostByUser } from '../data/posts.js';

const router = Router();

router.get('/:userId', async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    try {

        const user = await getUserById(req.params.userId);

        let isSelf = false;
        let isBlocked = false;

        isBlocked = req.session.user.blocked_users.map(id => id.toString()).includes(req.params.userId);
        if (req.params.userId === req.session.user._id.toString()) isSelf = true;

        let posts = [];
        try {
            posts = await getPostByUser(req.params.userId);
        } catch (e) {
            // If no posts found, posts remains empty array
        }

        let totalScore = 0;
        posts.forEach(p => {
            if (p.post_score) totalScore += p.post_score;
        });

        const avgScore = posts.length > 0 ? (totalScore / posts.length) : 0;
        const isStarContributor = posts.length >= 3 && avgScore >= 4.3;

        return res.render("profile", {
            title: user.username,
            user: user,
            self: isSelf,
            blocked: isBlocked,
            userScore: avgScore.toFixed(1),
            isStarContributor: isStarContributor
        });
    } catch (error) {
        if(error.message.includes("no user found")){
            return res.status(404).render("error", {
                title: "Error",
                error: "User not found"
            });
        }
        else if(error.message.includes("getUserById")){
            return res.status(400).render("error", {
                title: "Error",
                error: "Bad request"
            });
        }
        else{
            return res.status(500).render("error", {
                title: "Error",
                error: error.message
            })
        }
    }
})

router.post("/:blockId/unblock", async (req, res) => {
    try {
        //check if the user is logged in
        if (!req.session.user) {
            return res.status(401).render("error", {
                title: "Unauthorized",
                error: "You must be logged in to unblock a user."
            });
        }

        const blockId = req.params.blockId;
        const userId = req.session.user._id.toString();

        const updatedUser = await unblockUser(blockId, userId);
        req.session.user = updatedUser;
        // redirect to profile of unblocked user
        return res.redirect(`/user/${blockId}`);


    } catch (error) {
        if (error.message.includes("one or more users not found")) {
            return res.status(404).render("error", {
                title: "Error",
                error: "User not found"
            });
        }

        if (error.message.includes("blockUser")) {
            return res.status(400).render("error", {
                title: "Error",
                error: "Bad request"
            });
        }

        return res.status(500).render("error", {
            title: "Server Error",
            error: error.message
        });
    }
});

router.post("/:blockId/block", async (req, res) => {
    try {
        //check if the user is logged in
        if (!req.session.user) {
            return res.status(401).render("error", {
                title: "Unauthorized",
                error: "You must be logged in to block a user."
            });
        }

        const blockId = req.params.blockId;
        const userId = req.session.user._id.toString();

        const updatedUser = await blockUser(blockId, userId);
        req.session.user = updatedUser;
        // redirect to posts
        return res.redirect(`/posts`);


    } catch (error) {
        if (error.message.includes("one or more users not found")) {
            return res.status(404).render("error", {
                title: "Error",
                error: "User not found"
            });
        }

        if (error.message.includes("blockUser")) {
            return res.status(400).render("error", {
                title: "Error",
                error: "Bad request"
            });
        }

        return res.status(500).render("error", {
            title: "Server Error",
            error: error.message
        });
    }
});

export default router;

