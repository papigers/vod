import axios from 'utils/axios';
import { getFollowedChannels } from 'containers/App/actions';

export function followChannel(id) {
  return dispatch =>
    axios.put(`/channels/${id}/follow`).then(() => {
      dispatch(getFollowedChannels());
    });
}

export function unfollowChannel(id) {
  return dispatch =>
    axios.put(`/channels/${id}/unfollow`).then(() => {
      dispatch(getFollowedChannels());
    });
}

