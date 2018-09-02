import React, { Component } from 'react';
import { Box, Flex } from 'grid-styled';
import axios from 'axios';

import VideoList, { VIDEO_LIST_TYPE } from 'components/VideoList';

const VIDEO_LISTS_DATA = {
  new: {
    label: 'חדשים',
    endpoint: `${process.env.REACT_APP_API_HOSTNAME}/api/videos/new`,
  },
  top: {
    label: 'הנצפים ביותר',
    endpoint: `${process.env.REACT_APP_API_HOSTNAME}/api/videos/top`,
  },
  trending: {
    label: 'חמים',
    endpoint: `${process.env.REACT_APP_API_HOSTNAME}/api/videos/trending`,
  },
  random: {
    label: 'רנדומלי',
    endpoint: `${process.env.REACT_APP_API_HOSTNAME}/api/videos/random`,    
  },
};

class HomePage extends Component {
  constructor() {
    super();
    this.state = {};
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
          {Object.keys(VIDEO_LISTS_DATA).map(videoListId => (
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
