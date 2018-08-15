import { createSelector } from 'reselect';

const selectGlobal = state => state.get('global');

const makeSelectSidebar = () =>
  createSelector(selectGlobal, globalState => globalState.get('sidebar'));

export { selectGlobal, makeSelectSidebar };
