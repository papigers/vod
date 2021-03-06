import { combineReducers } from 'redux-immutable';

import route from './route';
import global from './global';
import user from './user';
import upload from './upload';
import preload from './preload';
import notifications from './notifications';

export default combineReducers({
  route,
  global,
  user,
  upload,
  preload,
  notifications,
});
