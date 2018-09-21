import { createStore, applyMiddleware, compose } from "redux";
import { routerMiddleware } from "react-router-redux";
import { fromJS } from 'immutable';
import thunk from 'redux-thunk';

import reducers from './reducers';

export default function configureStore(initialState = {}, history) {
  const middlewares = [
    thunk,
    routerMiddleware(history)
  ];

  const enhancers = [applyMiddleware(...middlewares)];

  // If Redux DevTools Extension is installed use it, otherwise use Redux compose
  const composeEnhancers =
    process.env.NODE_ENV !== 'production' && typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
          shouldHotReload: false,
        })
      : compose;

  const store = createStore(reducers, fromJS(initialState), composeEnhancers(...enhancers));

  return store;
}
