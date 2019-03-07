import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import qs from 'query-string';

import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Image } from 'office-ui-fabric-react/lib/Image';
import { List } from 'office-ui-fabric-react/lib/List';

import axios from 'utils/axios';
import PlaylistVideoCard from 'components/PlaylistVideoCard';
import ChannelRow from 'containers/ChannelRow';

const PlaylistContainer = styled.div`
  display: flex;
  height:100%;
`;

const PlaylistDetails = styled.div`
  width:40%;
  display: flex;
  padding: 24px 32px;
  position: relative;
  width: fit-content;
  flex-direction: column;
  background: ${({ theme }) => theme.palette.neutralLighterAlt};

  h1{
    cursor: pointer;
  }
`;

const PlaylistMetadata = styled.div`
  display: flex;
  font-size: small;
  color: ${({ theme }) => theme.palette.neutralTertiary};
  margin-bottom: 10px;

  .ms-Icon{
    font-size: xx-small;
    padding-top: .3rem;
  }
`;

const PlaylistVideos = styled.div`
  width: 60%;
`;

const PlaylistChannel = styled(ChannelRow)`
  border-top: ridge;
  padding-top: 10px;
`;

const PlaylistThumbnail = styled.div`
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: flex-end;
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
  width: 100%;
  justify-content: center;
  padding: 10px;
  font-size: medium;
  
  p {
    margin: 0;
    padding-left: .5rem;
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

  onLinkClick = () =>{
    const { playlist } = this.state;
    this.props.history.push(playlist && `/watch?v=${playlist.videos[0].id}&list=${playlist.id}`);
  }

  render() {
    const { playlist }= this.state;
    return (
      <PlaylistContainer>
        {!playlist ? null : <Fragment>
          <PlaylistDetails>
            <PlaylistThumbnail onClick={this.onLinkClick}>
              <Image
                src={`${process.env.REACT_APP_STREAMER_HOSTNAME}/${playlist.videos[0].id}/thumbnail.png`}
                height={200}
                />
              <ThumbnailOverlay>
                <p>{'נגן הכל'}</p>
                <Icon iconName={'CaretSolidRight'} />
              </ThumbnailOverlay>
            </PlaylistThumbnail>
            <h1 onClick={this.onLinkClick}>
              {playlist.name}
            </h1>
            <PlaylistMetadata>
              {playlist.videos.length === 1 ? `סירטון אחד` : `${playlist.videos.length} סירטונים` }
              <Icon iconName={'LocationDot'} />
              {`עודכן לאחרונה בתאריך ${new Date(playlist.updatedAt).toDateString()}`}
            </PlaylistMetadata>
            <PlaylistChannel size={48} channel={playlist.channel} user={this.props.user} />
          </PlaylistDetails>
          <PlaylistVideos>
            <List items={playlist.videos} data-is-scrollable="true" onRenderCell={ (item, index) => 
                <PlaylistVideoCard item={item} index={index} playlistId={playlist.id}/>
              } />
          </PlaylistVideos>
        </Fragment>}
      </PlaylistContainer>
    );
  }
}

export default PlaylistPage;