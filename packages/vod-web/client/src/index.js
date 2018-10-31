import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import createHistory from 'history/createBrowserHistory';
import { Route } from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';
import { ScrollContext } from 'react-router-scroll-4';

import { Fabric } from 'office-ui-fabric-react/lib/Fabric';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
// import 'office-ui-fabric-react/dist/css/fabric.min.css';

import styledSanitize from 'styled-sanitize';
import { injectGlobal } from 'styled-components';

import App from './containers/App';
import AuthRequired from './containers/AuthRequired';
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
      <ScrollContext>
        <ThemeProvider>
          <Fabric>
            <Route render={props => (
              <AuthRequired>
                <App {...props} />
              </AuthRequired>
              )}
            />
          </Fabric>
        </ThemeProvider>
      </ScrollContext>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root'),
);
