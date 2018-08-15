import React, { Component } from 'react';
import { createStructuredSelector } from 'reselect';

import Channel from 'components/Channel';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectUser } from './selectors';

class ChannelPage extends Component {
  render() {
    return (
      <Channel channel={this.props.user} />
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

export default createReduxContainer(ChannelPage, mapStateToProps);
