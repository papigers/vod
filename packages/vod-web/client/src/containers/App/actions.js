import { SIDEBAR_OPEN_TOGGLE, CHANNEL_MODAL_OPEN_TOGGLE, SET_MANAGED_CHANNELS } from 'constants/actionTypes';

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

export function setManagedChannels(managed) {
  return {
    type: SET_MANAGED_CHANNELS,
    managed,
  }
}
