import React, { Component, Fragment } from 'react';
import { bindActionCreators } from 'redux';
import { createStructuredSelector } from 'reselect';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectUser } from 'containers/Root/selectors';

import * as actions from './actions';

class AuthRequired extends Component {
  componentDidMount() {
    this.props.getUser();
  }

  render() {
    const { children, ...other } = this.props;

    if (this.props.user) {
      return (
        <Fragment>
          {React.Children.map(children, child => React.cloneElement(child, other))}
        </Fragment>
      );
    }
    return <div />;
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

const mapDispatchToProps = dispatch => {
  return bindActionCreators(actions, dispatch);
};

export default createReduxContainer(AuthRequired, mapStateToProps, mapDispatchToProps);
