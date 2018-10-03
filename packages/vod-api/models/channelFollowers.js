module.exports = function() {
  var channelFollowers = function ChannelFollower() {
    if (!(this instanceof ChannelFollower)) {
      return new ChannelFollower();
    }
  }

  channelFollowers.table = 'channelFollowers';
  channelFollowers.attributes = {
    followerId: {
      type: 'string',
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
    followeeId: {
      type: 'string',
      references: {
        column: 'id',
        table: 'channels',
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
    },
  };
  channelFollowers.indices = [
    { type: 'primary', attributes: ['followerId', 'followeeId'] },
  ];
  channelFollowers.createdAt = true;
  channelFollowers.updatedAt = true;

  return channelFollowers;
};
