import { createSelector } from 'reselect';

const selectUser = state => state.get('user');

const makeSelectUser = () => createSelector(selectUser, state => state.get('user'));
const makeSelectFollowedChannels = () => createSelector(selectUser, state => state.get('followedChannels'));

export { selectUser, makeSelectUser, makeSelectFollowedChannels };
