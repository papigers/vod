module.exports = function(db) {
  var channelFollowers = function ChannelFollower() {
    if (!(this instanceof ChannelFollower)) {
      return new ChannelFollower();
    }
  }

  channelFollowers.table = 'channelFollowers';
  channelFollowers.attributes = {
    followerId: {
      type: 'string',
      primaryKey: true,
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
    followeeId: {
      type: 'string',
      primaryKey: true,
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
  };
  channelFollowers.createdAt = true;
  channelFollowers.updatedAt = true;

  return channelFollowers;
};
