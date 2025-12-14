import helper from './helpers.js';
import commentData from './comments.js';
import { posts } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

/**
 * Create a new post.
 * Required fields: title, body(optional), photo(optional), location, sensitive, user.
 * Initialize all other fields in the schema
 */
export const createPost = async (title, body, photo, location, sensitive, user, anonymous) => {
    //check validation
    //check title
    title = helper.AvailableString(title, 'title');
    if (title.length < 3 && title.length > 30) throw "Title length must between 3 and 30 characters.";

    //check body(optional)
    if (body) {
        if (typeof body !== "string") throw "Post content must be a string.";
        if (body.length > 500) throw "Post content cannot be over 500 characters.";
    }

    //check photo(optional)
    if (photo) {
        photo = helper.AvailableString(photo, 'photo path');
    }

    //check location
    helper.AvailableObj(location, 'location');
    if (!location.hasOwnProperty('longitude')) throw "Location must contain longitude.";
    if (!location.hasOwnProperty('latitude')) throw "Location must contain latitude.";
    if (typeof location.longitude !== 'number' || location.longitude < -74.258 || location.longitude > -73.699) throw "Location must be in NYC";
    if (typeof location.latitude !== 'number' || location.latitude < 40.496 || location.latitude > 40.916) throw "Location must be in NYC";

    //check sensitive
    if (typeof sensitive !== 'boolean') throw "Sensitive must be a boolean.";

    //check user
    user = helper.AvailableString(user, 'user ID');

    // check anonymous
    if (typeof anonymous !== 'boolean') {
        throw "anonymous must be a boolean.";
    }

    //create new post
    const newPost = {
        title: title,
        body: body,
        photo: photo,
        date: new Date().toISOString(),
        location: {
            longitude: location.longitude,
            latitude: location.latitude
        },
        sensitive: sensitive,
        post_score: 0,
        user: user,
        anonymous: anonymous,
        comments: [],
        reports: [],
        ratings: [],
        isHidden: false
    };

    try {
        const postCollection = await posts();
        const insertInfo = await postCollection.insertOne(newPost);
        if (!insertInfo.acknowledged || !insertInfo.insertedId) throw "Failed to create post"


        console.log("Successfully created post", newPost);
        return newPost;
    } catch (e) {
        console.error(e);
        throw "Failed creating post in DB";
    }
}


/**
 * Get all existed posts
 */
export const getAllPosts = async () => {
    try {
        const postCollection = await posts();
        return await postCollection.find({ isHidden: { $ne: true } }).sort({ date: -1 }).toArray();
    } catch (e) {
        console.error(e);
        throw "Failed getting all posts in DB";
    }
}
//location filtering
export const getPostsByLocation = async (latitude, longitude, radius = 0.01) => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw "Latitude and longitude must be numbers";
    }
    if (latitude < 40.496 || latitude > 40.916 || longitude < -74.258 || longitude > -73.699) {
        throw "Location must be in NYC";
    }
    
    try {
        const postCollection = await posts();
        const postsList = await postCollection.find({
            isHidden: { $ne: true },
            'location.latitude': { $gte: latitude - radius, $lte: latitude + radius },
            'location.longitude': { $gte: longitude - radius, $lte: longitude + radius }
        }).sort({ date: -1 }).toArray();
        return postsList;
    } catch (e) {
        console.error(e);
        throw "Failed getting posts by location in DB";
    }
}


/**
 * Get a post by post ID.
 * Required field: id.
 */
export const getPostById = async (id) => {
    //check id
    id = helper.AvailableID(id, "post ID");

    //get user by id
    try {
        const postCollection = await posts();
        // Use aggregation to fetch post with full comment details
        const post = await postCollection.aggregate([
            { $match: { _id: new ObjectId(id) } },
            {
                $lookup: {
                    from: 'comments',
                    localField: 'comments',
                    foreignField: '_id',
                    as: 'comments'
                }
            }
        ]).toArray();

        if (!post || post.length === 0) throw 'Error: Post not found';

        return post[0];
    } catch (e) {
        console.error(e);
        throw "Failed getting post by post ID in DB";
    }
}


/**
 * Get posts by user ID.
 * Required field: userId.
 */
export const getPostByUser = async (userId) => {
    //check userId
    userId = helper.AvailableID(userId, "user ID");

    try {
        const postCollection = await posts();
        const userPosts = await postCollection.find({ user: userId, isHidden: { $ne: true } }).sort({ date: -1 }).toArray();

        if (!userPosts) throw 'Error: Posts not found for this user';

        return userPosts;
    } catch (e) {
        console.error(e);
        throw "Failed getting posts by user ID in DB";
    }
}

/**
 * Get popular posts (sorted by post_score).
 */
export const getPopularPosts = async () => {
    try {
        const postCollection = await posts();
        return await postCollection.find({ isHidden: { $ne: true } }).sort({ post_score: -1 }).toArray();
    } catch (e) {
        console.error(e);
        throw "Failed getting popular posts in DB";
    }
}


/**
 * update post
 * Required fields: id, updatedPost
 */
export const updatePost = async (id, updatedPost) => {
    //check validation
    //check id
    id = helper.AvailableID(id, "post ID");
    //check updatedPost
    helper.AvailableObj(updatedPost, "updated post");

    //check every field
    const updatedPostData = {};
    //check title
    if (updatedPost.title) {
        let title = helper.AvailableString(updatedPost.title, 'title');
        if (title.length < 3 && title.length > 30) throw "Title length must between 3 and 30 characters.";
        updatedPostData.title = title;
    }

    //check body
    if (updatedPost.body) {
        let body = helper.AvailableString(updatedPost.body, 'body');
        if (body.length > 500) throw "Post content cannot be over 500 characters.";
        updatedPostData.body = body;
    }

    //check photo
    if (updatedPost.photo) {
        let photo = helper.AvailableString(updatedPost.photo, 'photo path');
        updatedPostData.photo = photo;
    }

    //check location
    if (updatedPost.location) {
        helper.AvailableObj(updatedPost.location, 'location');
        let location = updatedPost.location;
        if (!location.hasOwnProperty('longitude')) throw "Location must contain longitude.";
        if (!location.hasOwnProperty('latitude')) throw "Location must contain latitude.";
        if (typeof location.longitude !== 'number' || location.longitude < -74.258 || location.longitude > -73.699) throw "Location must be in NYC";
        if (typeof location.latitude !== 'number' || location.latitude < 40.496 || location.latitude > 40.916) throw "Location must be in NYC";
        updatedPostData.location = {
            longitude: location.longitude,
            latitude: location.latitude
        };
    }

    //check sensitive
    if (updatedPost.sensitive) {
        let sensitive = updatedPost.sensitive;
        if (typeof sensitive !== 'boolean') throw "Sensitive must be a boolean.";
        updatedPostData.sensitive = sensitive;
    }

    //check whether there are changes been input
    if (Object.keys(updatedPostData).length === 0) throw "No inputs were found.";

    //update post
    try {
        const postCollection = await posts();
        const updatedInfo = await postCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedPostData });

        if (updatedInfo.matchedCount === 0) throw "No post was found with this ID.";
        if (updatedInfo.modifiedCount === 0) console.log("Warning: No changes were made.");

        console.log("Post successfully updated!", updatedPostData);
        return updatedPostData;
    } catch (e) {
        console.error(e);
        throw "Failed updating post in DB.";
    }
}




/**
 * Delete a post by post ID.
 * Required field: id.
 */
export const deletePost = async (id) => {
    //check id
    id = helper.AvailableID(id, "post ID");

    //delete post
    try {
        const postCollection = await posts();

        // Delete all associated comments
        await commentData.deleteAllCommentsForPost(id);

        const deletedInfo = await postCollection.deleteOne({ _id: new ObjectId(id) });

        if (deletedInfo.deletedCount === 0) throw "No post was found with this ID.";

        console.log(`Post(ID: ${id}) successfully deleted!`);
        return {deleted: true, postId: id};
    } catch (e) {
        console.error(e);
        throw "Failed deleting post in DB.";
    }
}

/**
 * Hide a post by post ID.
 * Required field: id.
 */
export const hidePost = async (id) => {
    //check id
    id = helper.AvailableID(id, "post ID");

    try {
        const postCollection = await posts();
        const updateInfo = await postCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { isHidden: true } }
        );

        if (updateInfo.matchedCount === 0) throw "No post was found with this ID.";

        console.log(`Post(ID: ${id}) successfully hidden!`);
        return { hidden: true, postId: id };
    } catch (e) {
        console.error(e);
        throw "Failed hiding post in DB.";
    }
}
//post rating
export const ratePost = async (postId, userId, rating) => {
    postId = helper.AvailableID(postId, "post ID");
    userId = helper.AvailableID(userId, "user ID");
    
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw "Rating must be a number between 1 and 5";
    }
    
    try {
        const postCollection = await posts();
        const post = await postCollection.findOne({ _id: new ObjectId(postId) });
        if (!post) throw "Post not found";
        
        const existingRating = post.ratings.find(r => r.user.toString() === userId);
        
        if (existingRating) {
            await postCollection.updateOne(
                { _id: new ObjectId(postId), 'ratings.user': new ObjectId(userId) },
                { $set: { 'ratings.$.rating': rating } }
            );
        } else {
            await postCollection.updateOne(
                { _id: new ObjectId(postId) },
                { $push: { ratings: { user: new ObjectId(userId), rating: rating } } }
            );
        }
        
        const updatedPost = await postCollection.findOne({ _id: new ObjectId(postId) });
        const avgRating = updatedPost.ratings && updatedPost.ratings.length > 0 
            ? updatedPost.ratings.reduce((sum, r) => sum + r.rating, 0) / updatedPost.ratings.length 
            : 0;
        
        await postCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $set: { post_score: avgRating } }
        );
        
        return { rating: rating, averageRating: avgRating };
    } catch (e) {
        console.error(e);
        throw "Failed rating post in DB";
    }
}
