import { fromJS } from 'immutable';
import {
  SET_UPLOAD_PROGRESS,
  SET_UPLOAD_FILE,
  SET_UPLOAD_METADATA,
  SET_UPLOAD_STEP,
  SET_UPLOAD_VIDEO_SRC,
  SET_UPLOAD_VIDEO_THUMBNAILS,
  SELECT_UPLOAD_VIDEO_THUMBNAIL,
  SET_UPLOAD_VIDEO_NAME,
  SET_UPLOAD_VIDEO_DESCRIPTION,
  SET_UPLOAD_VIDEO_PRIVACY,
  SET_UPLOAD_VIDEO_ACL,
  SET_UPLOAD_ERROR,
} from 'constants/actionTypes';
import { LOCATION_CHANGE } from 'react-router-redux';

const uploadInitialState = fromJS({
  progress: 0,
  file: null,
  error: null,
  metadata: {
    size: 0,
    ratioW: 16,
    ratioH: 9,
    res: 0,
    duration: 0,
  },
  video: {
    thumbnails: [],
    selectedThumbnail: 0,
    src: null,
    name: '',
    description: '',
    privacy: 'private',
    acl: [],
  },
  step: 'upload',
});

function getProgress(step, progress) {
  switch(step) {
    case 'form_upload':
      // return progress * 0.3;
      return progress;
    case 'form_encode':
      // return 30 + (progress * 0.6);
      return progress * 0.9;
    case 'form_s3':
      return 90 + (progress * 0.1);
    default:
      return 0;
  }
}

export default function uploadReducer(state = uploadInitialState, action) {
  switch (action.type) {
    case SET_UPLOAD_PROGRESS:
      return state
        .set('progress', Math.min(100, getProgress(state.get('step'), action.progress || state.get('progress'))));
    case SET_UPLOAD_FILE:
      return state
        .set('file', fromJS(action.file))
        .setIn(['video', 'name'], action.file.name.replace(/\.[^/.]+$/, ''))
        .setIn(['metadata', 'size'], action.file.size)
        .set('error', null);
    case SET_UPLOAD_METADATA:
      return state
        .set('metadata', state.get('metadata').merge(action.metadata))
        .setIn(['video', 'name'], state.getIn(['video', 'name']) || action.metadata.name);
    case SET_UPLOAD_STEP:
      return state
        .set('step', action.step)
        .set('progress', action.step === 'form_encode' ? 0 : state.get('progress'));
    case SET_UPLOAD_VIDEO_SRC:
      return state.setIn(['video', 'src'], action.src);
    case SET_UPLOAD_VIDEO_THUMBNAILS:
      return state.setIn(['video', 'thumbnails'], fromJS(action.thumbnails));
    case SELECT_UPLOAD_VIDEO_THUMBNAIL:
      return state.setIn(['video', 'selectedThumbnail'], fromJS(action.thumbnail));
    case SET_UPLOAD_VIDEO_NAME:
      return state.setIn(['video', 'name'], action.name);
    case SET_UPLOAD_VIDEO_DESCRIPTION:
      return state.setIn(['video', 'description'], action.description);
    case SET_UPLOAD_VIDEO_PRIVACY:
      return state.setIn(['video', 'privacy'], action.privacy);
    case SET_UPLOAD_VIDEO_ACL:
      return state.setIn(['video', 'acl'], fromJS(action.acl));
    case SET_UPLOAD_ERROR:
      return state.merge(uploadInitialState)
        .set('error', action.error);
    case LOCATION_CHANGE:
      return uploadInitialState;
    default:
      return state;
  }
}
