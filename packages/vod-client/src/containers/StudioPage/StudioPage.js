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
    this.setState({
      playlistList: [
        {
          "id": "p~fbJZsR4n5W",
          "createdAt": "2018-12-18T15:27:13.250Z",
          "name": "הדרכות",
          "description": "sdfsdfsdf",
          "state": "PUBLISHED",
          "videosCount": 2,
          "updatedAt": "2018-12-18T15:27:13.250Z",
          "firstVideoId": "7hapkzV6LjE4",
          "channel": {
              "id": "s7591665",
              "name": "גרשון ח פפיאשוילי",
          }
        }
        ,{
          "id": "p~fbJZsR4n5W",
          "createdAt": "2018-12-18T15:27:13.250Z",
          "name": "הדרכות",
          "description": "sdfsdfsdf",
          "state": "PRIVATE",
          "videosCount": 7,
          "updatedAt": "2018-13-18T15:27:13.250Z",
          "firstVideoId": "7hapkzV6LjE4",
          "channel": {
              "id": "s7591665",
              "name": "גרשון ח פפיאשוילי",
          }
        },{
          "id": "p~fbJZsR4n5W",
          "createdAt": "2018-12-18T15:27:13.250Z",
          "name": "הדרכות",
          "description": "sdfsdfsdf",
          "state": "UNLISTED",
          "videosCount": 6,
          "updatedAt": "2018-13-18T15:27:13.250Z",
          "firstVideoId": "7hapkzV6LjE4",
          "channel": {
              "id": "s1231231",
              "name": 'שגיא לוי',
          }
        }
      ]
    });
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
      />
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

export default createReduxContainer(StudioPage, mapStateToProps);
