import React, { Component } from 'react';
import { createStructuredSelector } from 'reselect';

import Studio from 'components/Studio';
import axios from 'utils/axios';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectUser } from 'containers/ChannelPage/selectors';

class StudioPage extends Component {
  constructor() {
    super();
    this.state = {
      videoList: [],
      playlistList: []
    };
  }

  componentDidMount() {
    this.fetchVideos();
    this.fetchPlaylists();
  }

  componentDidUpdate(prevProps) {
    if (this.props.user.id !== prevProps.user.id) {
      this.fetchVideos();
      this.fetchPlaylists();
    }
  }

  fetchVideos = () => {
    axios
      .get(`/videos/managed`)
      .then(({ data }) => {
        this.setState({
          videoList: data,
        });
      })
      .catch(err => {
        console.error(err);
      });
  };

  fetchPlaylists = () => {
    axios
      .get(`/playlists/managed`)
      .then(({ data }) => {
        this.setState({
          playlistList: data,
        });
      })
      .catch(err => {
        console.error(err);
      });
  };
  
  updatePlaylist = (playlist) => {
    return axios.put(`/playlists/${playlist.id}`, playlist)
    .finally(this.fetchPlaylists);
  };

  deletePlaylist = (id) => {
    return axios.delete(`/playlists/${id}`)
    .finally(this.fetchPlaylists);
  };

  deleteVideos = videos => {
    return Promise.all(
      videos.map(video => {
        return axios
          .delete(`/videos/${video.id}`)
          .then(result => Promise.resolve({ id: video.id, status: 'success', result }))
          .catch(error => Promise.resolve({ id: video.id, status: 'error', error }));
      }),
    ).finally(this.fetchVideos);
  };

  editVideosPrivacy = videos => {
    return axios.put(`/videos/permissions`, videos).finally(this.fetchVideos);
  };

  editVideo = video => {
    return axios.put(`/videos/video/${video.id}`, video).finally(this.fetchVideos);
  };

  editVideosProperty = (videos, property) => {
    return axios.put(`/videos/property/${property}`, videos).finally(this.fetchVideos);
  };

  editVideosTags = (videosId, action, tags) => {
    return axios
      .put(`/videos/tags/${action}`, {
        videosId,
        tags,
      })
      .finally(this.fetchVideos);
  };

  render() {
    const { videoList, playlistList } = this.state;
    return (
      <Studio
        videoList={videoList}
        playlistList={playlistList}
        onDelete={this.deleteVideos}
        onPropertyEdit={this.editVideosProperty}
        onTagsEdit={this.editVideosTags}
        onVideoShare={this.editVideosPrivacy}
        onVideoEdit={this.editVideo}
        onPlaylistUpdate={this.updatePlaylist}
        onPlaylistCreate={this.createPlaylist}
        onPlaylistDelete={this.deletePlaylist}
      />
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

export default createReduxContainer(StudioPage, mapStateToProps);
