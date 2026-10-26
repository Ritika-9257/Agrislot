const NotificationRepository = require('../repositories/notification.repository');

const NotificationService = {
  async notify({ userId, farmerId, title, message, type = 'INFO', entityType, entityId }) {
    return NotificationRepository.create({
      User_ID: userId || null,
      Farmer_ID: farmerId || null,
      Title: title,
      Message: message,
      Type: type,
      Related_Entity_Type: entityType,
      Related_Entity_ID: String(entityId)
    });
  },

  async getNotifications({ farmerId, userId, unreadOnly = false, limit = 20 } = {}) {
    const notifications = await NotificationRepository.findAll({ farmerId, userId, unreadOnly, limit });
    const unreadCount = notifications.filter(n => !n.Is_Read).length;
    return {
      notifications,
      unreadCount
    };
  },

  async markAsRead(notificationId) {
    return NotificationRepository.markAsRead(notificationId);
  },

  async markAllAsRead({ farmerId, userId } = {}) {
    return NotificationRepository.markAllAsRead({ farmerId, userId });
  }
};

module.exports = NotificationService;
