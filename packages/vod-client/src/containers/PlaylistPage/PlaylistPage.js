import React, { Component } from 'react';
import styled from 'styled-components';
import qs from 'query-string';

import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Overlay } from 'office-ui-fabric-react/lib/Overlay';
import { Image } from 'office-ui-fabric-react/lib/Image';
import { List } from 'office-ui-fabric-react/lib/List';

import axios from 'utils/axios';
import PlaylistVideoCard from 'components/PlaylistVideoCard';

const PlaylistContainer = styled.div`
  display: flex;

`;

const PlaylistContent = styled.div`
  height:100%;
  width:40%;
  display: block;
  padding: 24px 32px;
  position: relative;
  justify-content: center;
`;

const PlaylistVideos = styled.div`
  width: 60%;
`;

const ThumbnailOverlay = styled.div`
  background-color: black;
  display: flex;
  // position: relative;
  align-content: center;
  // width: 50%;
  // height: 40px;
  opacity: 0.5;
  font-size: xx-large;
  color: white;
  position: fixed;
  
  p {
    margin: 0;
    // color: white;
    padding-left: .5rem;
  }

  .ms-Icon{
    // color: white;
  }
  
`;

class PlaylistPage extends Component {
  constructor() {
    super();
    this.state = {
      playlist: null,
      loadingPlaylist: true,
      error: null,
    };
  }

  static getDerivedStateFromProps(props, state) {
    const playlistId = qs.parse(props.location.search).list;

    if (!state.playlistId || state.playlistId !== playlistId) {
      return {
        playlistId: playlistId,
        loadingPlaylist: true,
        error: null,
      };
    }
    return null;
  }

  componentDidMount() {
    this.fetchPlaylist();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.playlistId !== this.state.playlistId) {
      this.fetchPlaylist();
    }
  }

  fetchPlaylist() {
    if (this.state.playlistId) {
      axios
      .get(`/playlists/${this.state.playlistId}`)
      .then(({ data }) => {
        this.setState({
          playlist: data,
          loadingPlaylist: false,
          error: null,
        });
      }).catch(err => {
        this.setState({
          playlist: null,
          loadingPlaylist: false,
          error: parseInt(err.response && err.response.status),
        });
      });
    }
  }

  render() {
    const { playlist }= this.state;
    return (
      <PlaylistContainer>
          {this.state.error ? this.props.history.push(`/`):null}
          <PlaylistContent>
            <Image
              src={playlist && playlist.videos.length &&
              `${process.env.REACT_APP_STREAMER_HOSTNAME}/${playlist.videos[0].id}/thumbnail.png`}
              height={200}
              />
              <Overlay>
                <ThumbnailOverlay>
                  <p>{'נגן הכל'}</p>
                  <Icon iconName={'CaretSolidRight'} />
                </ThumbnailOverlay>
              </Overlay>
            </PlaylistContent>
          <PlaylistVideos>
            <List items={playlist && playlist.videos} data-is-scrollable="true" onRenderCell={ (item, index) => 
                <PlaylistVideoCard item={item} index={index} playlistId={playlist.id}/>
              } />
          </PlaylistVideos>
      </PlaylistContainer>
    );
  }
}

export default PlaylistPage;