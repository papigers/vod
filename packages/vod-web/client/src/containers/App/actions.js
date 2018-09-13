import { SIDEBAR_OPEN_TOGGLE, CHANNEL_MODAL_OPEN_TOGGLE, SET_MANAGED_CHANNELS, SET_FOLLOWED_CHANNELS } from 'constants/actionTypes';
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
      .then(result => {
        dispatch(setManagedChannels(result.data));
      })
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
  return (dispatch, getState) => 
    axios.get(`channels/${makeSelectUser()(getState()).get('id')}/following`)
      .then(result => {
        dispatch(setFollowedChannels(result.data));
      })
      .catch(error => {
        console.log('Could not fetch following channels');
        console.error(error);
      });
}
