import React, { Component } from 'react';
import { createStructuredSelector } from 'reselect';

import Studio from 'components/Studio';
import axios from 'utils/axios';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectUser } from 'containers/ChannelPage/selectors';
import { makeSelectSidebar } from 'containers/App/selectors';

class StudioPage extends Component {
    constructor() {
        super();
        this.state = {
            videoList: {},
            refresh: false,
        };
        this.editVideosMetadata = this.editVideosMetadata.bind(this);
    }

    

    componentDidMount () {
        this.fetchVideos();
    }

    componentDidUpdate(prevProps) {
        if (this.state.refresh || this.props.user.id !== prevProps.user.id) {
            this.fetchVideos();
            this.setState({
                refresh: false,
            })
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
        return axios.delete(`/videos`,{
            videos
        })
        .then(({ data }) => {
            console.log(data);
            this.setState({
                refresh: true,
            });
        }).catch((err) => {
            console.error(err);
        });
    }

    editVideoPrivacy(video){
        return axios.put(`/videos/video/${video.id}/permissions`, {
            video
        })
        .then(() => this.setState({ refresh: true }))
        .catch((err) => {
            console.log(err);
        });
    }

    editVideosMetadata(videos, property){
        return axios.put(`/videos/metadata/${property}`, {
            videos
        })
        .then(( data ) => {
            this.setState({ refresh: true });
        })
        .catch((err) => {
            console.log(err);
        });
    }

    editVideosTags(videos, action, tags){
        return axios.put(`/videos/tags/${action}`, {
            videos,
            tags,
        })
        .then(( data ) => {
            this.setState({ refresh: true });
        })
        .catch((err) => {
            console.log(err);
        });
    }

    render() {
        const { videoList } = this.state;
        const { sidebar } = this.props;
        return (
            <Studio
                sidebarisopen={sidebar.open}
                videoList={videoList}
                onDelete={this.deleteVideos}
                onMetadataEdit={this.editVideosMetadata}
                onTagsEdit={this.editVideosTags}
                onVideoShare={this.editVideoPrivacy}
            />
        );
    }
}

const mapStateToProps = createStructuredSelector({
    user: makeSelectUser(),
    sidebar: makeSelectSidebar(),
  });
  
  export default createReduxContainer(StudioPage, mapStateToProps);
  