import React, { Component } from 'react';
import { createStructuredSelector } from 'reselect';
import { bindActionCreators } from 'redux';

import Channel from 'components/Channel';
import axios from 'utils/axios';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectUser } from './selectors';
import * as actions from './actions';

class ChannelPage extends Component {
  constructor() {
    super();
    this.state = {
      channel: null,
      loading: true,
      error: null,
      authorized: false,
    };
  }

  static getDerivedStateFromProps(props, state) {
    const propsId = props.match.params.channelId;
    if (!state.channelId || (state.channelId !== propsId)) {
      if (propsId === undefined) {
        return {
          channelId: props.user.id,
          channel: props.user,
          loading: false,
          error: null,
        };
      }
      return {
        channelId: propsId,
        video: null,
        loading: true,
        error: null,
      };
    } 
    return null;
  }

  componentDidMount() {
    this.fetchChannel();
    this.fetchEditAuthorization();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.channelId !== prevState.channelId) {
      this.fetchChannel();
      this.fetchEditAuthorization();
    }
  }

  fetchChannel() {
    axios.get(`/channels/${this.state.channelId}`)
      .then(({ data }) => {
        this.setState({
          channel: data,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        console.error(err);
        this.props.history.push('/channel');
      });
  }

  fetchEditAuthorization() {
    axios.get(`/private/authz/manage-channel/${this.state.channelId}`)
      .then(({ data }) => {
        this.setState({
          authorized: data.authorized,
        });
      })
      .catch(console.error);
  }

  render() {
    const {
      channel,
      loading,
      authorized,
    } = this.state;

    return (
      <Channel {...this.props} channel={channel} loading={loading} authorized={authorized}/>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(actions, dispatch);
};

export default createReduxContainer(ChannelPage, mapStateToProps, mapDispatchToProps);
