import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/mongoConnection.js';

const getNotificationsCollection = async () => {
    const db = await dbConnection();
    return db.collection('notifications');
};

const getUsersCollection = async () => {
    const db = await dbConnection();
    return db.collection('users');
};

// create a notification for a user
export const createNotification = async (userId, postId, postTitle, distance, location) => {
    if (!userId || !postId || !postTitle) {
        throw new Error('Missing required fields');
    }

    const notifications = await getNotificationsCollection();

    const newNotification = {
        userId: new ObjectId(userId),
        postId: new ObjectId(postId),
        postTitle: postTitle,
        distance: Math.round(distance * 100) / 100,
        location: location,
        read: false,
        createdAt: new Date()
    };

    const result = await notifications.insertOne(newNotification);
    return { ...newNotification, _id: result.insertedId };
};

// get all notifications for a user
export const getNotificationsByUser = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required');
    }
    const notifications = await getNotificationsCollection();
    return await notifications
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();
};

// get unread notification count for a user
export const getUnreadCount = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required');
    }
    const notifications = await getNotificationsCollection();
    return await notifications.countDocuments({
        userId: new ObjectId(userId),
        read: false
    });
};

// mark a notification as read
export const markAsRead = async (notificationId) => {
    if (!notificationId) {
        throw new Error('Notification ID is required');
    }
    const notifications = await getNotificationsCollection();
    const result = await notifications.updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { read: true } }
    );
    return result.modifiedCount > 0;
};

// mark all notifications as read for a user
export const markAllAsRead = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required');
    }
    const notifications = await getNotificationsCollection();
    const result = await notifications.updateMany(
        { userId: new ObjectId(userId), read: false },
        { $set: { read: true } }
    );
    return result.modifiedCount;
};

// delete a notification
export const deleteNotification = async (notificationId) => {
    if (!notificationId) throw new Error('Notification ID is required');

    const notifications = await getNotificationsCollection();
    const result = await notifications.deleteOne({ _id: new ObjectId(notificationId) });
    return result.deletedCount > 0;
};

// calculate distance between two points (in miles)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// find users near a location and create notifications for them
export const notifyNearbyUsers = async (postId, postTitle, postAddress, radiusMiles = 1, excludeUserId = null) => {
    let postLat, postLng;
    try {
        const coords = await geocodeAddress(postAddress);
        postLat = coords.latitude;
        postLng = coords.longitude;
    } catch (error) {
        console.error("Geocoding failed for post address:", error);
        return []; 
    }
    

    const users = await getUsersCollection();

    // find users who have set their location and enabled notifications
    const usersWithLocation = await users.find({
        'location.latitude': { $exists: true, $ne: null },
        'location.longitude': { $exists: true, $ne: null },
        notificationsEnabled: { $ne: false }
    }).toArray();

    const notifiedUsers = [];

    for (const user of usersWithLocation) {
        // ... (rest of the logic remains the same)

        // skip the user who created the post
        if (excludeUserId && user._id.toString() === excludeUserId.toString()) {
            continue;
        }

        const userRadius = user.notificationRadius || 1; // 1 mile
        
        const distance = calculateDistance(
            user.location.latitude,
            user.location.longitude,
            postLat, // geocoded latitude
            postLng  // geocoded longitude
        );

        // if user is within their preferred radius, create a notification
        if (distance <= userRadius) {
            try {
                await createNotification(
                    user._id,
                    postId,
                    postTitle,
                    distance,
                    { latitude: postLat, longitude: postLng }
                );
                notifiedUsers.push({
                    userId: user._id,
                    username: user.username,
                    distance: distance
                });
            } catch (error) {
                console.error(`Failed to notify user ${user._id}:`, error);
            }
        }
    }

    return notifiedUsers;
};

export default {
    createNotification,
    getNotificationsByUser,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    calculateDistance,
    notifyNearbyUsers
};
