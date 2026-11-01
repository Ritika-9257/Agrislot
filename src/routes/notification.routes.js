const express = require('express');
const NotificationService = require('../services/notification.service');
const { authenticateOptional } = require('../middleware/authenticate');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

router.use(authenticateOptional);

// GET /api/v1/notifications
router.get('/', async (req, res, next) => {
  try {
    const farmerId = req.query.farmerId || (req.user?.farmerId ? req.user.farmerId : null);
    const userId = req.user?.userId || null;
    const unreadOnly = req.query.unread === 'true';

    const result = await NotificationService.getNotifications({
      farmerId: farmerId ? parseInt(farmerId, 10) : null,
      userId: userId ? parseInt(userId, 10) : null,
      unreadOnly,
      limit: parseInt(req.query.limit, 10) || 20
    });

    return successResponse(res, {
      message: 'In-app notifications retrieved successfully',
      data: result.notifications,
      meta: { unreadCount: result.unreadCount }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await NotificationService.markAsRead(id);
    return successResponse(res, {
      message: 'Notification marked as read',
      data: { notificationId: id, isRead: true }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    const farmerId = req.user?.farmerId || null;
    const userId = req.user?.userId || null;
    const updated = await NotificationService.markAllAsRead({ farmerId, userId });
    return successResponse(res, {
      message: 'All notifications marked as read',
      data: { affectedRows: updated }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
