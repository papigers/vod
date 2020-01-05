exports.up = function(knex, Promise) {
  return knex.schema.alterTable('videoLikes', function(t) {
    t.dropPrimary();
    t.primary(['videoId', 'channelId'])
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('videoLikes', function(t) {
    t.dropPrimary();
    t.primary('videoId')
  })
};
