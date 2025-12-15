import express from 'express';
import * as notificationsData from '../data/notifications.js';

const router = express.Router();

// check if user is logged in
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        if (req.path.startsWith('/api')) {
            return res.status(401).json({ error: 'You must be logged in.' });
        }
        return res.redirect('/login');
    }
    next();
};

// get all notifications for the logged-in user 
router.get('/api/notifications', requireAuth, async (req, res) => {
    try {
        const notifications = await notificationsData.getNotificationsByUser(req.session.user._id);
        const unreadCount = await notificationsData.getUnreadCount(req.session.user._id);
        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// get unread notification count 
router.get('/api/notifications/count', requireAuth, async (req, res) => {
    try {
        const count = await notificationsData.getUnreadCount(req.session.user._id);
        res.json({ count });
    } catch (error) {
        console.error('Error fetching notification count:', error);
        res.status(500).json({ error: 'Failed to fetch notification count' });
    }
});

// Mark a notification as read (API)
router.post('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
        const success = await notificationsData.markAsRead(req.params.id);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Notification not found' });
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// mark all notifications as read (API)
router.post('/api/notifications/read-all', requireAuth, async (req, res) => {
    try {
        const count = await notificationsData.markAllAsRead(req.session.user._id);
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

// delete a notification (API)
router.delete('/api/notifications/:id', requireAuth, async (req, res) => {
    try {
        const success = await notificationsData.deleteNotification(req.params.id);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Notification not found' });
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// HTML
router.get('/notifications', requireAuth, async (req, res) => {
    try {
        const notifications = await notificationsData.getNotificationsByUser(req.session.user._id);
        res.render('notifications', {
            title: 'Notifications',
            notifications,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error loading notifications page:', error);
        res.status(500).render('error', { error: 'Failed to load notifications' });
    }
});

export default router;
