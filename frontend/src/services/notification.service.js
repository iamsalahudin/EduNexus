<<<<<<< HEAD
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
=======
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
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
