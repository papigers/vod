import React from 'react';
import ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import { Route } from 'react-router-dom';
import { createBrowserHistory as createHistory } from 'history'
import { ConnectedRouter } from 'react-router-redux';
import { ScrollContext } from 'react-router-scroll-4';

import { Fabric } from 'office-ui-fabric-react/lib/Fabric';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';

import ThemeProvider from './theme';
import Root from 'containers/Root';
import configureStore from './configureStore';

import 'video.js/dist/video-js.min.css';
import 'utils/videojs/index';

initializeIcons(`${window.location.origin}/fonts/`);

const history = createHistory();
const store = configureStore({}, history);

function render(Root) {
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <ScrollContext>
          <ThemeProvider>
            <Fabric>
              <Helmet>
                <title>VOD</title>
              </Helmet>
              <Route component={Root} />
            </Fabric>
          </ThemeProvider>
        </ScrollContext>
      </ConnectedRouter>
    </Provider>,
    document.getElementById('root'),
  );
}

render(Root);

if (process.env.NODE_ENV !== 'production') {
  if (module.hot) {
    module.hot.accept('containers/Root', () => {
      const NextRoot = require('containers/Root').default;
      render(NextRoot);
    });
  }
}
