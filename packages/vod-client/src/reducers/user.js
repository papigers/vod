import { fromJS } from 'immutable';
import { SET_USER, SET_MANAGED_CHANNELS, SET_FOLLOWED_CHANNELS } from 'constants/actionTypes';

let initial = {
  user: null,
  followedChannels: [],
};
// if (process.env.REACT_APP_TEST_USER && process.env.NODE_ENV !== 'production') {
//   initial.user = JSON.parse(process.env.REACT_APP_TEST_USER);
// }
const userInitialState = fromJS(initial);

export default function userReducer(state = userInitialState, action) {
  switch (action.type) {
    case SET_USER:
      console.log(action.user);
      return state.setIn(['user'], fromJS(action.user));
    case SET_MANAGED_CHANNELS:
      console.log(state);
      return state.setIn(
        ['user', 'managedChannels'],
        fromJS(action.managed.filter(channel => channel.id !== state.getIn(['user', 'id']))),
      );
    case SET_FOLLOWED_CHANNELS:
      return state.set('followedChannels', fromJS(action.followed));
    default:
      return state;
  }
}
