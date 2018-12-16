import React, { Component } from 'react';
import { Box, Flex } from 'grid-styled';
import axios from 'utils/axios';
import { knuthShuffle as shuffle } from 'knuth-shuffle'

import VideoList, { VIDEO_LIST_TYPE } from 'components/VideoList';

const VIDEO_LISTS_DATA = {
  recommended: {
    label: 'מומלצים',
    endpoint: '/videos/list/recommended',
  },
  new: {
    label: 'חדשים',
    endpoint: '/videos/list/new',
  },
  top: {
    label: 'מובילים',
    endpoint: '/videos/list/top',
  },
  trending: {
    label: 'חמים',
    endpoint: '/videos/list/trending',
  },
  random: {
    label: 'רנדומלי',
    endpoint: '/videos/list/random',    
  },
};

class HomePage extends Component {
  constructor() {
    super();
    this.state = {};
    this.videoOrder = shuffle(Object.keys(VIDEO_LISTS_DATA));
    Object.keys(VIDEO_LISTS_DATA).forEach(key => this.state[key] = {
      videos: [],
      loading: true,
    });
  }

  componentDidMount() {
    this.fetchVideos();
  }

  fetchVideos() {
    Object.keys(VIDEO_LISTS_DATA).forEach((videoListId) => {
      axios.get(VIDEO_LISTS_DATA[videoListId].endpoint)
        .then(({ data }) => {
          this.setState({
            [videoListId]: {
              videos: data,
              loading: false,
            },
          });
        })
        .catch(console.error); 
    });
  }

  render() {
    return (
      <Flex justifyContent="center">
        <Box px={16} py={12} pb={8} width={[1, 1, 1, 0.92]}>
          {this.videoOrder.map(videoListId => (
            <VideoList
              key={videoListId}
              category={VIDEO_LISTS_DATA[videoListId].label}
              videos={this.state[videoListId].videos}
              loading={this.state[videoListId].loading}
              type={VIDEO_LIST_TYPE.GRID}
            />
          ))}
        </Box>
      </Flex>
    );
  }
}

export default HomePage;
