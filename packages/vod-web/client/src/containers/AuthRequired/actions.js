import { SET_USER } from 'constants/actionTypes';
import axios from 'utils/axios';

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
