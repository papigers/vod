import { SET_MANAGED_CHANNELS } from 'constants/actionTypes';
import axios from 'utils/axios';

function setManagedChannels(managed) {
  return {
    type: SET_MANAGED_CHANNELS,
    managed,
  };
}

export function getManagedChannels() {
  return dispatch =>
    axios
      .get('channels/managed')
      .then(result => dispatch(setManagedChannels(result.data)))
      .catch(error => {
        console.log('Could not fetch managed channels');
        console.error(error);
      });
}
