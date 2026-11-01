const express = require('express');
const NotificationService = require('../services/notification.service');
const UserRepository = require('../repositories/user.repository');
const { authenticateOptional } = require('../middleware/authenticate');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

router.use(authenticateOptional);

// GET /api/v1/notifications
router.get('/', async (req, res, next) => {
  try {
    let farmerId = req.query.farmerId ? parseInt(req.query.farmerId, 10) : null;
    let userId = req.query.userId ? parseInt(req.query.userId, 10) : null;

    if (req.user) {
      userId = req.user.userId;
      if (req.user.farmerId) {
        farmerId = req.user.farmerId;
      } else {
        const userRec = await UserRepository.findById(req.user.userId);
        if (userRec && userRec.Farmer_ID) {
          farmerId = userRec.Farmer_ID;
        }
      }
    }

    // If an unauthenticated caller did not provide farmerId or userId, return empty array
    if (!farmerId && !userId) {
      return successResponse(res, {
        message: 'In-app notifications retrieved successfully',
        data: [],
        meta: { unreadCount: 0 }
      });
    }

    const unreadOnly = req.query.unread === 'true';

    const result = await NotificationService.getNotifications({
      farmerId,
      userId,
      unreadOnly,
      limit: parseInt(req.query.limit, 10) || 50
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
    let farmerId = (req.body?.farmerId || req.query?.farmerId) ? parseInt(req.body?.farmerId || req.query?.farmerId, 10) : null;
    let userId = (req.body?.userId || req.query?.userId) ? parseInt(req.body?.userId || req.query?.userId, 10) : null;

    if (req.user) {
      userId = req.user.userId;
      if (req.user.farmerId) {
        farmerId = req.user.farmerId;
      } else {
        const userRec = await UserRepository.findById(req.user.userId);
        if (userRec && userRec.Farmer_ID) {
          farmerId = userRec.Farmer_ID;
        }
      }
    }

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
