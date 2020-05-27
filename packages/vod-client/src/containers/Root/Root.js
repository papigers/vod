import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';

import AuthRequired from 'containers/AuthRequired';
import App from 'containers/App';
import ManagementApp from 'containers/ManagementApp';
import { createStructuredSelector } from 'reselect';
import createReduxContainer from 'utils/createReduxContainer';
import * as actions from './actions';
import { bindActionCreators } from 'redux';

import { makeSelectUser } from './selectors';

class Root extends Component {
  componentDidMount() {
    this.props.getManagedChannels();

    fetch("/config")
      .then(res => res.json())
      .then(data => {
          window.apiEndpoint = data.apiEndpoint;
          window.streamingEndpoint = data.streamingEndpoint;
      })
      .catch(function() {
          console.log("Cant reach server");
      });
  }

  shouldComponentUpdate(nextProps) {
    return true;
  }

  render() {
    return (
      <AuthRequired>
        <Switch>
          <Route path="/mgmt" component={ManagementApp} />
          <Route component={App} />
        </Switch>
      </AuthRequired>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

const mapDispatchToProps = dispatch => {
  return bindActionCreators(actions, dispatch);
};

export default createReduxContainer(Root, mapStateToProps, mapDispatchToProps);
