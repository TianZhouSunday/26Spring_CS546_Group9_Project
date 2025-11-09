import helper from './helpers.js';
import {posts} from "../config/mongoCollections.js";

/**
 * Create a new post.
 * Required fields: title, body(optional), photo(optional), location, sensitive, user.
 * Initialize all other fields in the schema
 */
export const createPost = async (title, body, photo, location, sensitive, user) => {
    //check validation

    //check title
    title = helper.AvailableString(title, 'title');
    if(title.length < 3 && title.length > 30) throw "Title length must between 3 and 30 characters.";

    //check body(optional)
    if(body) {
        if(typeof body !== "string") throw "Post content must be a string.";
        if(body.length > 500) throw "Post content cannot be over 500 characters.";
    }

    //check photo(optional)
    if(photo) {
        photo = helper.AvailableString(photo, 'photo path');
    }

    //check location
    helper.AvailableObj(location, 'location');
    if(!location.hasOwnProperty('longitude')) throw "Location must contain longitude.";
    if(!location.hasOwnProperty('latitude')) throw "Location must contain latitude.";
    if(typeof location.longitude !== 'number' || location.longitude < -74.258 || location.longitude > -73.699) throw "Location must be in NYC";
    if(typeof location.latitude !== 'number' || location.latitude < 40.496 || location.latitude > 40.916) throw "Location must be in NYC";

    //check sensitive
    if(typeof sensitive !== 'boolean') throw "Sensitive must be a boolean.";

    //check user
    user = helper.AvailableString(user, 'user');


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
        comments: [],
        reports: []
    };

    const postCollection = await posts();
    const insertInfo = await postCollection.insertOne(newPost);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) throw "Failed to create post"

    console.log("Successfully created post", newPost);
    return newPost;
}