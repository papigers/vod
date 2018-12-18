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
            videoList: {},
        };
        this.editVideosMetadata = this.editVideosMetadata.bind(this);
    }

    componentDidMount () {
        this.fetchVideos();
    }

    componentDidUpdate(prevProps) {
        if (this.props.user.id !== prevProps.user.id) {
            this.fetchVideos();
        }
    }

    fetchVideos() {
        axios.get(`/videos/managed`)
            .then(({ data }) => {
                const videoList = {};
                data.forEach(element => {
                    if (!videoList[element.channel.id]) {
                        videoList[element.channel.id] = {channelName : element.channel.name, videos : []};
                    }
                    videoList[element.channel.id].videos = [...videoList[element.channel.id].videos,element];
                });
                this.setState({
                    videoList: videoList,
                });
            }).catch((err) => {
                    console.error(err);
            });
    }

    deleteVideos(videos){
        return Promise.all(videos.map(video => {
            return axios.delete(`/videos/${video.id}`)
            .then(result => Promise.resolve({ id: video.id, status: 'success', result }))
            .catch(error => Promise.resolve({ id: video.id, status: 'error', error }));
        }));
        
    }

    editVideosPrivacy(videos){
        return axios.put(`/videos/permissions`, videos)
        .then( () => this.fetchVideos())
        .catch((err) => {
            console.log(err);
        });
    }

    editVideo(video){
        return axios.put(`/videos/video/${video.id}`, video)
        .then(() => this.fetchVideos())
        .catch((err) => {
            console.log(err);
        })
    }

    editVideosMetadata(videos, property){
        return axios.put(`/videos/metadata/${property}`, videos)
        .then(() => this.fetchVideos())
        .catch((err) => {
            console.log(err);
        });
    }

    editVideosTags(videosId, action, tags){
        return axios.put(`/videos/tags/${action}`, videosId, tags)
        .then(() => this.fetchVideos())
        .catch((err) => {
            console.log(err);
        });
    }

    render() {
        const { videoList } = this.state;
        return (
            <Studio
                videoList = {videoList}
                onDelete = {this.deleteVideos}
                onMetadataEdit = {this.editVideosMetadata}
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
  