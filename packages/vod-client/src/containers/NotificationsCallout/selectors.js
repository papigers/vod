import { createSelector } from 'reselect';
import { Set } from 'immutable';

const selectNotifications = state => state.get('notifications');

const makeSelectNotifications = () =>
  createSelector(
    selectNotifications,
    notificationState => notificationState.get('notifications'),
  );

const makeSelectUnreadNotificationCount = () =>
  createSelector(
    makeSelectNotifications(),
    notifications => notifications.count(notif => notif.get('unread')),
  );

const makeSelectLastNotificationDate = () =>
  createSelector(
    makeSelectNotifications(),
    notifications => {
      var last = notifications.last();
      return (last && last.get('createdAt')) || '';
    },
  );

const makeSelectNotificationsError = () =>
  createSelector(
    selectNotifications,
    notificationState => notificationState.get('error'),
  );

const makeSelectNotificationsLoading = () =>
  createSelector(
    selectNotifications,
    notificationState => notificationState.get('loading'),
  );

const makeSelectUnreadNotifications = () =>
  createSelector(
    makeSelectNotifications(),
    notifications => notifications.filter(notif => notif.get('unread')),
  );

const makeSelectUnreadIds = () =>
  createSelector(
    makeSelectUnreadNotifications(),
    unreadNotifications =>
      unreadNotifications.reduce((ids, notif) => {
        return ids.union(notif.get('notifications').map(single => single.get('id')));
      }, Set()),
  );

export {
  selectNotifications,
  makeSelectNotifications,
  makeSelectUnreadNotificationCount,
  makeSelectLastNotificationDate,
  makeSelectNotificationsError,
  makeSelectNotificationsLoading,
  makeSelectUnreadIds,
};
