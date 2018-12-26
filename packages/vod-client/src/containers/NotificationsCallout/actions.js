import {
  SET_NOTIFICATIONS,
  LOAD_NOTIFICATIONS,
  SET_NOTIFICATIONS_ERROR,
  READ_NOTIFICATIONS,
} from 'constants/actionTypes';
import axios from 'utils/axios';

import {
  makeSelectLastNotificationDate,
  makeSelectUnreadIds,
  makeSelectLastNotificationCheckDate,
} from './selectors';

function setNotifications(notifications, concat) {
  return {
    type: SET_NOTIFICATIONS,
    notifications,
    concat,
  };
}

function setNotificationsError(error) {
  return {
    type: SET_NOTIFICATIONS_ERROR,
    error,
  };
}

function loadNotifications() {
  return {
    type: LOAD_NOTIFICATIONS,
  };
}

let checkInterval;
export function syncNotifications() {
  return (dispatch, getState) => {
    const after = makeSelectLastNotificationCheckDate()(getState());
    dispatch(loadNotifications());
    return axios
      .get(`notifications?after=${after}`)
      .then(result => dispatch(setNotifications(result.data, 'start')))
      .catch(error => {
        dispatch(setNotificationsError(error));
        console.log('Could not fetch notifications');
        console.error(error);
      });
  };
}

export function getNotifications(more) {
  clearInterval(checkInterval);
  return (dispatch, getState) => {
    dispatch(loadNotifications());
    var before = more ? makeSelectLastNotificationDate()(getState()) : '';
    return axios
      .get(`notifications?before=${before}`)
      .then(result => {
        dispatch(setNotifications(result.data, more ? 'end' : null));
        checkInterval = setInterval(() => dispatch(syncNotifications()), 20000);
      })
      .catch(error => {
        dispatch(setNotificationsError(error));
        console.log('Could not fetch notifications');
        console.error(error);
      });
  };
}

function localReadNotifications() {
  return {
    type: READ_NOTIFICATIONS,
  };
}

export function readNotifications() {
  return (dispatch, getState) => {
    const readIds = makeSelectUnreadIds()(getState()).toJS();
    if (readIds.length) {
      return axios
        .put(`notifications/read`, {
          notifications: readIds,
        })
        .then(result => dispatch(localReadNotifications()))
        .catch(error => {
          console.log('Could not read notifications');
          console.error(error);
        });
    }
  };
}
