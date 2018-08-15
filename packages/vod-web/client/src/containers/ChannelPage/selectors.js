import { createSelector } from 'reselect';

const selectUser = state => state.get('user');

const makeSelectUser = () => createSelector(selectUser, state => state);

export { selectUser, makeSelectUser };
