import React, { Component } from 'react';
import styled from 'styled-components';
import videojs from 'video.js';
import { createStructuredSelector } from 'reselect';

import createReduxContainer from 'utils/createReduxContainer';
import axios from 'utils/axios';

import { makeSelectPreloadId } from './selectors';

const Hidden = styled.div`
  display: none;
`;

class VideoPreloader extends Component {
  componentDidMount() {
    this.player = videojs(this.videoNode, {
      autoplay: false,
      muted: true,
      preload: true,
      html5: {
        dash: {
          setXHRWithCredentialsForType: [null, true],
        },
      },
    });
    this.preloadVideoData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.preloadId !== this.props.preloadId) {
      this.preloadVideoData();
    }
  }

  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  }

  preloadVideoData() {
    if (this.player) {
      this.player.reset();
      if (this.props.preloadId) {
        axios
          .get(`/videos/video/${this.props.preloadId}`)
          .then(() => {
            this.player.src({
              src: `${window._env_.REACT_APP_STREAMER_HOSTNAME}/${this.props.preloadId}/mpd.mpd`,
              type: 'application/dash+xml',
            });
            this.player.load();
          })
          .catch(err => {
            // just don't preload
          });
      }
    }
  }

  render() {
    return (
      <Hidden>
        <video
          ref={videoNode => {
            this.videoNode = videoNode || this.videoNode;
          }}
        />
        {this.props.preloadId && (
          <img
            src={`${window._env_.REACT_APP_STREAMER_HOSTNAME}/${this.props.preloadId}/poster.png`}
            alt="preload-poster"
          />
        )}
      </Hidden>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  preloadId: makeSelectPreloadId(),
});

export default createReduxContainer(VideoPreloader, mapStateToProps);
