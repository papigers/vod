import React, { Component } from 'react';
import { Box } from 'grid-styled';
import styled from 'styled-components';
import queryString from 'query-string';

import ChannelRow from 'containers/ChannelRow';
import VideoCard from 'components/VideoCard';
import VideoList, { VIDEO_LIST_TYPE, ThumbnailList } from 'components/VideoList';
import axios from 'utils/axios';

const ChannelResult = styled(ChannelRow)`
  margin-bottom: 16px;

  .ms-Persona-coin {
    width: 258px;
    height: 118px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

class Results extends Component {
  constructor() {
    super();
    this.state = {
      results: [],
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.search();
  }

  componentDidUpdate(prevProps) {
    var prevQuery = queryString.parse(prevProps.location.search).query;
    this.search(prevQuery);
  }

  search(prevQuery) {
    const query = queryString.parse(this.props.location.search).query;
    if (query && query !== prevQuery) {
      this.setState({
        results: [],
        loading: true,
        error: null,
      });
      axios
        .get('/search', {
          params: {
            query,
          },
        })
        .then(({ data }) => {
          this.setState({
            results: data,
            loading: false,
          });
        })
        .catch(err => {
          // TODO something
          this.setState({
            loading: false,
            error: err,
          });
        });
    }
  }

  renderResults() {
    const { loading, results } = this.state;
    if (loading) {
      return <VideoList loading pageCount={20} type={VIDEO_LIST_TYPE.LIST} />;
    }
    return (
      <ThumbnailList type={VIDEO_LIST_TYPE.LIST}>
        {results.map(result => {
          switch (result.type) {
            case 'channel':
              return <ChannelResult channel={result} />;
            case 'video':
            default:
              return <VideoCard compact video={result} key={result.id} />;
          }
        })}
      </ThumbnailList>
    );
  }

  render() {
    return (
      <Box py={24} px={36} pl={40}>
        {this.renderResults()}
      </Box>
    );
  }
}

export default Results;
