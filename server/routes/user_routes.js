import { Router } from 'express';
import { getUserById } from '../data/users.js';

const router = Router();

router.get('/:userId', async (req, res) => {
    try {
        const user = await getUserById(req.params.userId);
        return res.render("profile", {title: user.username, user: user});
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

        // redirect to user profile
        return res.redirect(`/users/${userId}`);


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