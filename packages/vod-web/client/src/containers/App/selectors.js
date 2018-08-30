import { createSelector } from 'reselect';

const selectGlobal = state => state.get('global');

const makeSelectSidebar = () =>
  createSelector(selectGlobal, globalState => globalState.get('sidebar'));

const makeSelectChannelModal = () =>
  createSelector(selectGlobal, globalState => globalState.get('channelModalOpen'));

export { selectGlobal, makeSelectSidebar, makeSelectChannelModal };
