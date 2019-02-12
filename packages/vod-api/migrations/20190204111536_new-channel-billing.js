var models = require('../models').models;
var createTable = require('../knexfile').createTable;
var dropTable = require('../knexfile').dropTable;

exports.up = async function(knex) {
  var freeSubId = models.subscriptions.generateId();
  var personalSubId = models.subscriptions.generateId();
  var testSubId = models.subscriptions.generateId();
  var foreverFrom = new Date();
  foreverFrom.setFullYear(foreverFrom.getFullYear() - 100);
  var foreverTo = new Date();
  foreverTo.setFullYear(foreverTo.getFullYear() + 100);
  return createTable(knex, models.plans, 'plans')
    .then(function() {
      return knex.table('plans').insert([
        {
          id: 'free',
          name: 'ניסיון',
          sizeQuota: 100,
          videoQuota: 1,
          price: 0,
        },
        {
          id: 'personal',
          name: 'יוזר אישי',
          sizeQuota: 2048,
          price: 0,
        },
        {
          id: '1',
          name: 'ערוץ הילדים',
          sizeQuota: 1024,
          price: 499,
        },
        {
          id: '2',
          name: 'קולנוע ישראלי',
          sizeQuota: 2048,
          price: 899,
        },
        {
          id: '5',
          name: 'HBO',
          sizeQuota: 5120,
          price: 1999,
        },
        {
          id: '10',
          name: 'אוסקר',
          sizeQuota: 10240,
          price: 3499,
        },
        {
          id: 'test',
          name: 'בדיקה',
          sizeQuota: 10240,
          price: 0,
        },
      ]);
    })
    .then(function() {
      return createTable(knex, models.subscriptions, 'subscriptions');
    })
    .then(function() {
      return knex.table('subscriptions').insert([
        {
          id: freeSubId,
          planId: 'free',
          verified: true,
          from: foreverFrom,
          to: foreverTo,
        },
        {
          id: testSubId,
          planId: 'test',
          verified: true,
          from: foreverFrom,
          to: foreverTo,
        },
        {
          id: personalSubId,
          planId: 'personal',
          verified: true,
          from: foreverFrom,
          to: foreverTo,
        },
      ]);
    })
    .then(function() {
      return createTable(knex, models.workflows, 'workflows');
    })
    .then(function() {
      return knex.schema.table('channels', function(table) {
        table
          .specificType('activeSubscriptionId', 'char(16)')
          // .notNullable()
          // .defaultTo(freeSubId)
          .references('id')
          .inTable('subscriptions')
          .onDelete('set null')
          .onUpdate('cascade');
        table
          .boolean('active')
          .notNullable()
          .defaultTo(false);
      });
    })
    .then(function() {
      return knex.table('channels').update({
        active: true,
        activeSubscriptionId: knex.raw('case when ?? = ? then ? else ? end', [
          'channels.personal',
          true,
          personalSubId,
          testSubId,
        ]),
      });
    })
    .then(function() {
      return knex.schema.alterTable('channels', function(table) {
        table
          .specificType('activeSubscriptionId', 'char(16)')
          .notNullable()
          .alter();
      });
    })
    .then(function() {
      return knex.schema
        .raw(
          `
            CREATE OR REPLACE FUNCTION on_delete_workflow_cascade()
            RETURNS trigger AS $$
            BEGIN
              DELETE FROM workflows WHERE (TG_TABLE_NAME = 'channels' AND type = 'CREATE_CHANNEL') OR (TG_TABLE_NAME = 'subscriptions' AND type = 'CREATE_SUBSCRIPTION') AND (subject = OLD.id OR "secondarySubject" = OLD.id);
              RETURN NEW;
            END;
            $$ language 'plpgsql';
          `,
        )
        .raw(
          `
            CREATE OR REPLACE FUNCTION on_update_workflow_cascade()
            RETURNS trigger AS $$
            BEGIN
              UPDATE workflows SET subject = NEW.id WHERE (TG_TABLE_NAME = 'channels' AND type = 'CREATE_CHANNEL') OR (TG_TABLE_NAME = 'subscriptions' AND type = 'CREATE_SUBSCRIPTION') AND (subject = OLD.id);
              UPDATE workflows SET "secondarySubject" = NEW.id WHERE (TG_TABLE_NAME = 'channels' AND type = 'CREATE_CHANNEL') OR (TG_TABLE_NAME = 'subscriptions' AND type = 'CREATE_SUBSCRIPTION') AND ("secondarySubject" = OLD.id);
              RETURN NEW;
            END;
            $$ language 'plpgsql';
          `,
        )
        .raw(
          `
            CREATE OR REPLACE FUNCTION default_channel_subscription()
            RETURNS trigger AS $$
            BEGIN
              NEW."activeSubscriptionId" =
                CASE NEW.personal
                  WHEN true THEN '${personalSubId}'
                  ELSE '${freeSubId}'
                END;
              RETURN NEW;
            END
            $$ language 'plpgsql';
          `,
        );
    })
    .then(function() {
      return Promise.all(
        ['subscriptions', 'channels'].map(function(subjectTable) {
          return knex.schema
            .raw(
              `
                CREATE TRIGGER ??
                AFTER UPDATE ON ??
                FOR EACH ROW
                WHEN (OLD.id <> NEW.id)
                EXECUTE PROCEDURE on_update_workflow_cascade();
              `,
              [`${subjectTable}_workflows_update_cascade`, subjectTable],
            )
            .raw(
              `
                CREATE TRIGGER ??
                AFTER DELETE ON ??
                FOR EACH ROW
                EXECUTE PROCEDURE on_delete_workflow_cascade();
              `,
              [`${subjectTable}_workflows_delete_cascade`, subjectTable],
            );
        }),
      );
    })
    .then(function() {
      return knex.schema.raw(
        `
          CREATE TRIGGER ??
          BEFORE INSERT ON ??
          FOR EACH ROW
          WHEN (NEW."activeSubscriptionId" IS NULL OR NEW.personal = true)
          EXECUTE PROCEDURE default_channel_subscription();
        `,
        ['default_channel_subscription_trigger', 'channels'],
      );
    });
};

exports.down = async function(knex) {
  return Promise.all(
    ['subscriptions', 'channels'].map(function(subjectTable) {
      return knex.schema
        .raw(
          `
            drop trigger if exists ?? on ??;
          `,
          [`${subjectTable}_workflows_update_cascade`, subjectTable],
        )
        .raw(
          `
            drop trigger if exists ?? on ??;
          `,
          [`${subjectTable}_workflows_delete_cascade`, subjectTable],
        );
    }),
  )
    .then(function() {
      return knex.schema
        .raw(
          `
            drop trigger if exists ?? on ??;
          `,
          ['default_channel_subscription_trigger', 'channels'],
        )
        .table('channels', function(table) {
          table.dropColumn('activeSubscriptionId');
          table.dropColumn('active');
        });
    })
    .then(function() {
      return dropTable(knex, models.workflows, 'workflows');
    })
    .then(function() {
      return dropTable(knex, models.subscriptions, 'subscriptions');
    })
    .then(function() {
      return dropTable(knex, models.plans, 'plans');
    })
    .then(function() {
      return knex.schema
        .raw('drop function if exists on_update_workflow_cascade() cascade')
        .raw('drop function if exists on_delete_workflow_cascade() cascade')
        .raw('drop function if exists default_channel_subscription() cascade');
    });
};
