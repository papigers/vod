import { fromJS } from 'immutable';
import { LOCATION_CHANGE } from 'react-router-redux';
import { matchPath } from 'react-router'
import { SIDEBAR_OPEN_TOGGLE } from '../constants/actionTypes';

const untrapNavbarRoutes = [{
  path: '/watch*',
  exact: true,
}, {
  path: '/upload',
  exact: true,
}];

const globalInitialState = fromJS({
  sidebar: {
    open: true,
    trapped: true,
    prevState: null,
  },
});

export default function routeReducer(state = globalInitialState, action) {
  let restoreSidebar = false;
  let fullPathname = null;
  switch (action.type) {
    case LOCATION_CHANGE:
      fullPathname = `${action.payload.pathname}${action.payload.search}${action.payload.hash}`;
      restoreSidebar = !untrapNavbarRoutes.some(path => matchPath(fullPathname, path));
      if (restoreSidebar && state.getIn(['sidebar', 'prevState']) !== null) {
        return state.set('sidebar', state.get('sidebar').merge(
          state.getIn(['sidebar', 'prevState'])).setIn(['sidebar', 'prevState'], null)
        );
      }
      else if (!restoreSidebar) {
        return state
          .setIn(['sidebar', 'prevState'], state.getIn(['sidebar', 'prevState']) || state.get('sidebar').filter((v, k) => k !== 'prevState'))
          .setIn(['sidebar', 'trapped'], false)
          .setIn(['sidebar', 'open'], false);
      }
      return state;
    case SIDEBAR_OPEN_TOGGLE:
      return state.setIn(['sidebar', 'open'], !state.getIn(['sidebar', 'open']));
    default:
      return state;
  }
}
