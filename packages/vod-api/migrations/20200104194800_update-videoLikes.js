exports.up = function(knex, Promise) {
  return knex.schema
    .raw('alter table "videoLikes" DROP CONSTRAINT "videoLikes_pkey"')
    .raw('alter table "videoLikes" ADD PRIMARY KEY ("createdAt")');
};

exports.down = function(knex, Promise) {
  return knex.scehma
    .raw('alter table "videoLikes" DROP CONSTRAINT "videoLikes_pkey"')
    .raw('alter table "videoLikes" ADD PRIMARY KEY ("videoId")');
};
