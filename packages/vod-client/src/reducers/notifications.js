import { fromJS } from 'immutable';
import {
  SET_NOTIFICATIONS,
  LOAD_NOTIFICATIONS,
  SET_NOTIFICATIONS_ERROR,
  READ_NOTIFICATIONS,
} from 'constants/actionTypes';

let initial = {
  notifications: [],
  error: null,
  loading: true,
  checkTime: JSON.parse(JSON.stringify(new Date())),
};
const notificationsInitialState = fromJS(initial);

export default function notificationsReducer(state = notificationsInitialState, action) {
  switch (action.type) {
    case SET_NOTIFICATIONS:
      let notifications = state.get('notifications');
      if (action.concat === 'start') {
        notifications = fromJS(action.notifications).concat(notifications);
      } else if (action.concat === 'end') {
        notifications = notifications.concat(fromJS(action.notifications));
      }
      return state
        .set('notifications', notifications)
        .set('loading', false)
        .set('error', null);
    case SET_NOTIFICATIONS_ERROR:
      return state.set('loading', false).set('error', action.error);
    case LOAD_NOTIFICATIONS:
      return state
        .set('loading', true)
        .set('error', null)
        .set('checkTime', JSON.parse(JSON.stringify(new Date())));
    case READ_NOTIFICATIONS:
      return state.set(
        'notifications',
        state.get('notifications').map(group => {
          return group
            .set('unread', false)
            .set('notifications', group.get('notifications').map(not => not.set('unread', false)));
        }),
      );
    default:
      return state;
  }
}
