import notificationsService from './notificationsService'

const notificationService = {
  listNotifications: async (params = {}) => {
    return notificationsService.inbox(params)
  },

  getNotification: async (id) => {
    return notificationsService.getRequest(id)
  },

  markAsRead: async (id) => {
    return notificationsService.markRead(id)
  },

  markAllAsRead: async () => {
    return { ok: false, unsupported: true }
  },

  deleteNotification: async (id) => {
    return notificationsService.dismiss(id)
  },

  deleteAllNotifications: async () => {
    return { ok: false, unsupported: true }
  }
}

export default notificationService
