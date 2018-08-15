import { combineReducers } from 'redux-immutable';

import route from './route';
import global from './global';
import user from './user';
import upload from './upload';

export default combineReducers({
  route,
  global,
  user,
  upload,
});
