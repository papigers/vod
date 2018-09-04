import { SET_PRELOAD_ID } from 'constants/actionTypes';

const preloadInitialState = null;

export default function userReducer(state = preloadInitialState, action) {
  switch (action.type) {
    case SET_PRELOAD_ID:
      return action.preloadId;
    default:
      return state;
  }
}
