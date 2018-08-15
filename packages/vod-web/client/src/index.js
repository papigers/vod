import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import createHistory from 'history/createBrowserHistory';
import { Route } from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';

import { Fabric } from 'office-ui-fabric-react/lib/Fabric';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
// import 'office-ui-fabric-react/dist/css/fabric.min.css';

import styledSanitize from 'styled-sanitize';
import { injectGlobal } from 'styled-components';

import App from './containers/App';
import ThemeProvider from './theme';

import configureStore from './configureStore';

import 'video.js/dist/video-js.min.css';
import 'utils/videojs/index';

 
injectGlobal`
  ${styledSanitize}

  body {
    margin: 0;
  }

  a {
    text-decoration: inherit;
    color: inherit;
    outline: inherit;
  }
`;

initializeIcons(`${window.location.origin}/fonts/`);

const history = createHistory();
const store = configureStore({}, history);

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <ThemeProvider>
        <Fabric>
          <Route component={App} />
        </Fabric>
      </ThemeProvider>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root'),
);
