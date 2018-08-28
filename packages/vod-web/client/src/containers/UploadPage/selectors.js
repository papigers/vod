import { createSelector } from 'reselect';

function getStepSubState(step) {
  const keys = ['step', 'error'];
  switch (step) {
    case 'upload':
      return keys;
    default:
      return keys.concat(['progress', 'file', 'metadata', 'video']);
  }
}

const selectUpload = state => state.get('upload');

const makeSelectStepState = () =>
  createSelector(selectUpload, upload => upload.filter((v, k) => {
    const subStateKeys = getStepSubState(upload.get('step'));
    return subStateKeys.indexOf(k) !== -1;
  }));

export { selectUpload, makeSelectStepState };