import React, { Component } from 'react';
import { createStructuredSelector } from 'reselect';

import Channel from 'components/Channel';
import axios from 'utils/axios';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectUser } from './selectors';

class ChannelPage extends Component {
  constructor() {
    super();
    this.state = {
      channel: null,
      loading: true,
      error: null,
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
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.channelId !== prevState.channelId) {
      this.fetchChannel();
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

  render() {
    const {
      channel,
      loading,
    } = this.state;

    return (
      <Channel channel={channel} loading={loading} />
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

export default createReduxContainer(ChannelPage, mapStateToProps);
