import { comments, posts, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import helper from './helpers.js';

const exportMethods = {
    async createComment(postId, userId, text, score) {
        // Validate inputs
        console.log('createComment called with:', { postId, userId, text, score });
        postId = helper.AvailableID(postId, 'post ID');
        userId = helper.AvailableID(userId, 'user ID');
        text = helper.AvailableString(text, 'comment text');
        console.log('After validation:', { postId, userId, text, score });

        // validate score
        if (score === undefined || score === null) throw 'Score must be provided';
        score = Number(score);
        if (isNaN(score) || score < 0 || score > 5) throw 'Score must be a valid number between 0 and 5';

        // create new comment object following the schema
        const newComment = {
            _id: new ObjectId(),
            text: text,
            score: score,
            user: userId,
            post: postId
        };

        const commentCollection = await comments();
        console.log('Inserting comment into database...');
        const insertInfo = await commentCollection.insertOne(newComment);
        if (!insertInfo.acknowledged) throw 'Could not add comment';
        console.log('Comment inserted successfully');

        // pdate user: add comment ID to user's comments list
        const userCollection = await users();
        let userObjectId;
        try {
            userObjectId = new ObjectId(userId);
        } catch (e) {
            throw `Invalid user ID format: ${userId}`;
        }
        console.log('Updating user comments list...');
        const updateUser = await userCollection.updateOne(
            { _id: userObjectId },
            { $push: { comments: newComment._id } }
        );
        if (!updateUser.matchedCount) throw 'User not found';
        console.log('User updated successfully');

        // Update post: add comment ID to post's comments list and recalculate score
        const postCollection = await posts();
        let postObjectId;
        try {
            postObjectId = new ObjectId(postId);
        } catch (e) {
            throw `Invalid post ID format: ${postId}`;
        }
        console.log('Updating post comments list...');
        const updatePost = await postCollection.updateOne(
            { _id: postObjectId },
            { $push: { comments: newComment._id } }
        );
        if (!updatePost.matchedCount) throw 'Post not found';

        // Recalculate post score
        const allComments = await commentCollection.find({ post: postId }).toArray();
        let totalScore = 0;
        let scoreCount = 0;

        allComments.forEach(c => {
            if (typeof c.score === 'number') {
                totalScore += c.score;
                scoreCount++;
            }
        });

        const newAvgScore = scoreCount > 0
            ? Math.round((totalScore / scoreCount) * 10) / 10
            : null;

        await postCollection.updateOne(
            { _id: postObjectId },
            { $set: { post_score: newAvgScore } }
        );

        console.log('Post updated successfully with new score:', newAvgScore);

        // Return comment with the new post score (optional, but helpful if needed)
        return newComment;
    },

    async getCommentById(commentId) {
        commentId = helper.AvailableID(commentId, 'comment ID');
        const commentCollection = await comments();
        const comment = await commentCollection.findOne({ _id: new ObjectId(commentId) });
        if (!comment) throw 'Error: Comment not found';
        return comment;
    },

    async deleteComment(commentId) {
        commentId = helper.AvailableID(commentId, 'comment ID');
        const commentCollection = await comments();
        const comment = await this.getCommentById(commentId);

        const deletionInfo = await commentCollection.deleteOne({ _id: new ObjectId(commentId) });
        if (deletionInfo.deletedCount === 0) throw 'Could not delete comment';

        // Update User
        const userCollection = await users();
        let userObjectId;
        try {
            userObjectId = new ObjectId(comment.user);
        } catch (e) {
            throw `Invalid user ID format in comment: ${comment.user}`;
        }
        await userCollection.updateOne(
            { _id: userObjectId },
            { $pull: { comments: new ObjectId(commentId) } }
        );

        // Update Post
        const postCollection = await posts();
        let postObjectId;
        try {
            postObjectId = new ObjectId(comment.post);
        } catch (e) {
            throw `Invalid post ID format in comment: ${comment.post}`;
        }

        await postCollection.updateOne(
            { _id: postObjectId },
            { $pull: { comments: new ObjectId(commentId) } }
        );

        // Recalculate post score after deletion
        const allComments = await commentCollection.find({ post: comment.post }).toArray();
        let totalScore = 0;
        let scoreCount = 0;

        allComments.forEach(c => {
            if (typeof c.score === 'number') {
                totalScore += c.score;
                scoreCount++;
            }
        });

        const newAvgScore = scoreCount > 0
            ? Math.round((totalScore / scoreCount) * 10) / 10
            : null;

        await postCollection.updateOne(
            { _id: postObjectId },
            { $set: { post_score: newAvgScore } }
        );

        return { deleted: true };
    },

    async getAllComments(postId) {
        postId = helper.AvailableID(postId, 'post ID');
        const commentCollection = await comments();
        const commentList = await commentCollection.find({ post: postId }).toArray();

        const userCollection = await users();
        for (const comment of commentList) {
            try {
                if (comment.user) {
                    const user = await userCollection.findOne({ _id: new ObjectId(comment.user) });
                    if (user) {
                        comment.username = user.username;
                    } else {
                        comment.username = "Unknown User";
                    }
                }
            } catch (e) {
                comment.username = "Unknown User";
            }
        }

        return commentList;
    },

    async deleteAllCommentsForPost(postId) {
        postId = helper.AvailableID(postId, 'post ID');
        const commentCollection = await comments();
        const commentList = await commentCollection.find({ post: postId }).toArray();

        for (const comment of commentList) {
            await this.deleteComment(comment._id.toString());
        }

        return { deleted: true, count: commentList.length };
    }
};

export default exportMethods;
