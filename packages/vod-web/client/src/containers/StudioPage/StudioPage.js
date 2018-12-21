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
        };
    }

    componentDidMount () {
        this.fetchVideos();
    }

    componentDidUpdate(prevProps) {
        if (this.props.user.id !== prevProps.user.id) {
            this.fetchVideos();
        }
    }

    fetchVideos = () => {
        axios.get(`/videos/managed`)
            .then(({ data }) => {
                console.log(data);
                
                this.setState({
                    videoList: data,
                });
            }).catch((err) => {
                    console.error(err);
            });
    }

    deleteVideos = (videos) => {
        return Promise.all(videos.map(video => {
            return axios.delete(`/videos/${video.id}`)
            .then(result => Promise.resolve({ id: video.id, status: 'success', result }))
            .catch(error => Promise.resolve({ id: video.id, status: 'error', error }));
        }))
        .finally(this.fetchVideos);
        
    }

    editVideosPrivacy = (videos) => {
        return axios.put(`/videos/permissions`, videos)
        .finally(this.fetchVideos);
    }

    editVideo = (video) => {
        return axios.put(`/videos/video/${video.id}`, video)
        .finally(this.fetchVideos);
    }

    editVideosProperty = (videos, property) => {
        return axios.put(`/videos/property/${property}`, videos)
        .finally(this.fetchVideos);;
    }

    editVideosTags = (videosId, action, tags) => {
        return axios.put(`/videos/tags/${action}`, {
            videosId,
            tags
        })
        .finally(this.fetchVideos);
    }

    render() {
        const { videoList } = this.state;
        console.log(videoList);
        return (
            <Studio
                videoList = {videoList}
                onDelete = {this.deleteVideos}
                onPropertyEdit = {this.editVideosProperty}
                onTagsEdit = {this.editVideosTags}
                onVideoShare = {this.editVideosPrivacy}
                onVideoEdit = {this.editVideo}
            />
        );
    }
}

const mapStateToProps = createStructuredSelector({
    user: makeSelectUser(),
  });
  
  export default createReduxContainer(StudioPage, mapStateToProps);
  