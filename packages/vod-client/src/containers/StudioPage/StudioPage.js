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
          id: "1",
          createdAt: "2018-12-18T15:27:13.250Z",
          name: "הדרכות",
          description: "sdfsdfsdf",
          state: "PUBLISHED",
          videos: [
            {
              id: '4SAHL6TrwPBG',
              name: 'LAKAD MATATAAAG NORMALIN NORMALIN',
              description: 'DOTA DOTA DOTA',
              channel: {
                id: "s7591665",
                name: "גרשון ח פפיאשוילי",
              },
              privacy: 'PUBLIC',
              state: 'UNLISTED'
            },
            {
              id: 'qztxN1SMfFQ2',
              name: 'משפחת שווץ  פרק 2 - מבצר כריות",',
              description: 'נו מההה',
              channel: {
                id: "s7591665",
                name: "גרשון ח פפיאשוילי",
              },
              privacy: 'PUBLIC',
              state: 'UNLISTED'
            },
            {
              id: 'QKnHTWn4Ee6X',
              name: 'עומר אדם - שני משוגעים',
              description: 'איזה אומן איזהההה',
              channel: {
                id: "s7591665",
                name: "גרשון ח פפיאשוילי",
              },
              privacy: 'PUBLIC',
              state: 'UNLISTED'
            }
          ],
          updatedAt: "2018-12-18T15:27:13.250Z",
          channel: {
              id: "s7591665",
              name: "גרשון ח פפיאשוילי",
          }
        }
        ,{
          id: "2",
          createdAt: "2018-12-18T15:27:13.250Z",
          name: "שטויות",
          description: "sdfsdfsdf",
          state: "PUBLISHED",
          videos: [
            {
              id: 'QKnHTWn4Ee6X',
              name: 'עומר אדם - שני משוגעים',
              description: 'איזה אומן איזהההה',
              channel: {
                id: "s7591665",
                name: "גרשון ח פפיאשוילי",
              },
              privacy: 'PUBLIC',
              state: 'UNLISTED'
            },
            {
              id: 'qztxN1SMfFQ2',
              name: 'משפחת שווץ  פרק 2 - מבצר כריות",',
              description: 'נו מההה',
              channel: {
                id: "s7591665",
                name: "גרשון ח פפיאשוילי",
              },
              privacy: 'PUBLIC',
              state: 'UNLISTED'
            }
          ],
          updatedAt: "2018-12-18T15:27:13.250Z",
          channel: {
              id: "s7591665",
              name: "גרשון ח פפיאשוילי",
          }
        },{
          id: "3",
          createdAt: "2018-12-18T15:27:13.250Z",
          name: "דברים",
          description: "sdfsdfsdf",
          state: "PUBLISHED",
          videos: [
            {
              id: 'qztxN1SMfFQ2',
              name: 'משפחת שווץ  פרק 2 - מבצר כריות",',
              description: 'נו מההה',
              channel: {
                id: "s7591665",
                name: "גרשון ח פפיאשוילי",
              },
              privacy: 'PUBLIC',
              state: 'UNLISTED'
            },
            {
              id: '4SAHL6TrwPBG',
              name: 'LAKAD MATATAAAG NORMALIN NORMALIN',
              description: 'DOTA DOTA DOTA',
              channel: {
                id: "s7591665",
                name: "גרשון ח פפיאשוילי",
              },
              privacy: 'PUBLIC',
              state: 'UNLISTED'
            }
          ],
          updatedAt: "2018-12-18T15:27:13.250Z",
          channel: {
              id: "cj",
              name: "שגיא לוי",
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
