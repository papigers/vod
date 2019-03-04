import React, { Component, Fragment } from 'react';
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
  cursor: pointer;
  height:100%;
  width:40%;
  display: flex;
  padding: 24px 32px;
  position: relative;
  justify-content: center;

  .ms-Overlay{
    margin: 193px 46px 24px 45px;
    display: flex;
    justify-content: center;
    align-content: center;
    align-items: flex-end;
  }
`;

const PlaylistVideos = styled.div`
  width: 60%;
`;

const ThumbnailOverlay = styled.div`
  background-color: black;
  display: flex;
  position: relative;
  align-content: center;
  opacity: 0.8;
  color: white;
  position: absolute;
  align-items: center;
  padding: 4px 9.1em;
  
  p {
    margin: 0;
    padding-left: .5rem;
    font-size: x-large;
  }

  .ms-Icon{
    font-size: large;
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
        parseInt(err.response && err.response.status) === 404 ? this.props.history.push(`/`) : null
        this.setState({
          playlist: null,
          loadingPlaylist: false,
          error: err.response && err.response.message,
        });
      });
    }
  }

  onThumbnailClick = () =>{
    const { playlist } = this.state;
    this.props.history.push(playlist && `/watch?v=${playlist.videos[0].id}&list=${playlist.id}`);
  }

  render() {
    const { playlist }= this.state;
    return (
      <PlaylistContainer>
        {!playlist ? null : <Fragment>
          <PlaylistContent onClick={this.onThumbnailClick}>
            <Image
              src={playlist && `${process.env.REACT_APP_STREAMER_HOSTNAME}/${playlist.videos[0].id}/thumbnail.png`}
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
        </Fragment>}
      </PlaylistContainer>
    );
  }
}

export default PlaylistPage;