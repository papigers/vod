module.exports = function(db) {
  var notificationReceipts = function NotificationReceipts() {
    if (!(this instanceof NotificationReceipts)) {
      return new NotificationReceipts();
    }
  }

  notificationReceipts.table = 'notificationReceipts';
  notificationReceipts.attributes = {
    notificationId: {
      type: 'char',
      length: 18,
      primaryKey: true,
      notNullable: true,
      references: {
        column: 'id',
        table: 'notifications',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
    channelId: {
      type: 'string',
      primaryKey: true,
      notNullable: true,
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
  };
  notificationReceipts.createdAt = true;
  notificationReceipts.updatedAt = false;

  notificationReceipts.readNotifications = function(user, notificationIds) {
    return db.knex.raw(`${db.knex(notificationReceipts.table).insert(notificationIds.map(function(id) {
      return {
        notificationId: id,
        channelId: user && user.id,
      };
    })).toString()} on conflict do nothing`)
  }

  return notificationReceipts;
};
