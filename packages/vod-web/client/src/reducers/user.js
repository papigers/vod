import { fromJS } from 'immutable';
import { SET_USER } from 'constants/actionTypes';

let initial = {};
if (process.env.REACT_APP_TEST_USER && process.env.NODE_ENV !== 'production') {
  initial = JSON.parse(process.env.REACT_APP_TEST_USER);
}
const userInitialState = fromJS(initial);

export default function userReducer(state = userInitialState, action) {
  switch (action.type) {
    case SET_USER:
      return state.merge(action.user);
    default:
      return state;
  }
}
