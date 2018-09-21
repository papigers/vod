import { SIDEBAR_OPEN_TOGGLE, CHANNEL_MODAL_OPEN_TOGGLE, SET_MANAGED_CHANNELS, SET_FOLLOWED_CHANNELS, SET_USER } from 'constants/actionTypes';
import axios from 'utils/axios';

import { makeSelectUser } from 'containers/ChannelPage/selectors';

export function toggleSidebarOpen() {
  return {
    type: SIDEBAR_OPEN_TOGGLE,
  };
}

export function toggleChannelModalOpen() {
  return {
    type: CHANNEL_MODAL_OPEN_TOGGLE,
  };
}

function setManagedChannels(managed) {
  return {
    type: SET_MANAGED_CHANNELS,
    managed,
  };
}

export function getManagedChannels() {
  return (dispatch) => 
    axios.get('channels/managed')
      .then(result => dispatch(setManagedChannels(result.data)))
      .catch(error => {
        console.log('Could not fetch managed channels');
        console.error(error);
      });
}

function setFollowedChannels(followed) {
  return {
    type: SET_FOLLOWED_CHANNELS,
    followed,
  };
}

export function getFollowedChannels() {
  return (dispatch, getState) => {
    return axios.get(`channels/${makeSelectUser()(getState()).get('id')}/following`)
      .then(result => dispatch(setFollowedChannels(result.data)))
      .catch(error => {
        console.log('Could not fetch following channels');
        console.error(error);
      });
    }
}

function setUser(user) {
  return {
    type: SET_USER,
    user,
  };
}

function refreshUser() {
  return dispatch => 
    axios.get('refreshtoken')
      .then(() => dispatch(getUser()));
}

export function getUser() {
  return dispatch =>
    axios.get('profile')
      .then(result => {
        const user = result.data;
        const time = (user.exp * 1000) - Date.now() - 10000;
        // max milisecond time
        if (time <= 2147483647) {
          setTimeout(() => dispatch(refreshUser()), time)
        }
        return dispatch(setUser(result.data))
      })
      .catch(error => {
        console.log('Could not fetch current user');
        console.error(error);
      });
}
