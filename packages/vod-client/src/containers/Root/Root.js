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

  // state = {
  //   loadingConfig: true
  // };

  componentDidMount() {
    this.props.getManagedChannels();
    //this.setState({loadingConfig: false});
  }

  shouldComponentUpdate(nextProps) {
    return true;
  }

  render() {
    // if(this.state.loadingConfig){
    //   return (<p>Loading...</p>);
    // } else {
      return (
        <AuthRequired>
          <Switch>
            <Route path="/mgmt" component={ManagementApp} />
            <Route component={App} />
          </Switch>
        </AuthRequired>
      );
    //}
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

const mapDispatchToProps = dispatch => {
  return bindActionCreators(actions, dispatch);
};

export default createReduxContainer(Root, mapStateToProps, mapDispatchToProps);
