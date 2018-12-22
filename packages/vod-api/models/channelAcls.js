module.exports = function(db) {
  var channelAcls = function ChannelACL() {
    if (!(this instanceof ChannelACL)) {
      return new ChannelACL();
    }
  };

  channelAcls.table = 'channelAcls';
  channelAcls.attributes = {
    access: {
      type: 'enu',
      values: ['VIEW', 'MANAGE'],
      notNullable: true,
    },
    type: {
      type: 'enu',
      values: ['USER', 'AD_GROUP'],
      notNullable: true,
    },
    id: {
      type: 'string',
      primaryKey: true,
      notNullable: true,
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
  channelAcls.createdAt = true;
  channelAcls.updatedAt = true;

  channelAcls.getChannelAcls = function(channelId, user) {
    return db.knex
      .select(`${channelAcls.table}.id`, `${channelAcls.table}.type`, `${channelAcls.table}.access`)
      .from(channelAcls.table)
      .leftJoin(db.channels.table, `${channelAcls.table}.channelId`, `${db.channels.table}.id`)
      .where(`${channelAcls.table}.channelId`, channelId)
      .modify(db.channels.authorizedManageSubquery, user);
  };

  return channelAcls;
};
