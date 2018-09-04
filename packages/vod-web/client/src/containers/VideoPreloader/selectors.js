import { createSelector } from 'reselect';

const selectPreload = state => state.get('preload');

const makeSelectPreloadId = () =>
  createSelector(selectPreload, preloadState => preloadState);

export { selectPreload, makeSelectPreloadId };
