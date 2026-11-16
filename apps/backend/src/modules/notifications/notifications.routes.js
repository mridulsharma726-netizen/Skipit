const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');
const { requireAuth } = require('../../middleware/auth');

router.get('/', requireAuth, notificationsController.getNotifications);
router.patch('/:id/read', requireAuth, notificationsController.markAsRead);
router.patch('/read-all', requireAuth, notificationsController.markAllAsRead);
router.post('/device/register', requireAuth, notificationsController.registerDeviceToken);
router.post('/device/remove', requireAuth, notificationsController.removeDeviceToken);

module.exports = router;
