import { SET_PRELOAD_ID } from 'constants/actionTypes';

export function preload(preloadId) {
  return {
    type: SET_PRELOAD_ID,
    preloadId,
  };
}
