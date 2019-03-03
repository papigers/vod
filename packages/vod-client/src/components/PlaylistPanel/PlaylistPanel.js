import React, { Component } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

import { Label } from 'office-ui-fabric-react/lib/Label';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { List } from 'office-ui-fabric-react/lib/List';

import PlaylistVideoCard from 'components/PlaylistVideoCard';

const PanelContainer = styled.div`
  height: 36%;
`;

const PlaylistContainer = styled.div`
  position: relative;
  background: ${({ theme }) => theme.palette.neutralLight};
  padding-bottom: 5px;
  width: 100%;
`;

const VideosContainer = styled.div`
  background: ${({ theme }) => theme.palette.neutralLighter};
  width: 100%;
  height: 24.5em;
  /* height: 100%; */
`;

const PlaylistName = styled(Label)`
  font-size: large;
  margin: 0 0 8px 0;
`;

const PlaylistDescription = styled.div`
  padding: 16px 16px 10px 24px;
`;

const PlaylistDetails = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  
  .ms-Label{
    color: ${({ theme }) => theme.palette.neutralTertiary};
    font-size: smaller;
  }
`;

const PlaylistState = styled.div`
  border-radius: 4px;
  padding: 2px 4px;
  margin-left: 8px;
  background: ${({ theme }) => theme.palette.neutralQuaternary};

  & + & {
    margin-right: 5px;
  }
  .ms-Label{
    padding: 0;
  }
`;


class PlaylistPanel extends Component {

  renderPlaylistState = () =>{
    switch (this.props.playlist.state) {
      case 'PUBLISHED':
        return (
          <Label>
            <Icon iconName="RedEye" /> פומבי
          </Label>);
      case 'UNLISTED':
        return (
          <Label>
            <Icon iconName="Link" /> קישור בלבד
          </Label>);
      case 'PRIVATE':
      default:
        return (
          <Label>
            <Icon iconName="Hide" /> פרטי
          </Label>);
    }
  }

  render() {
    const { playlist, currVideoIndex } = this.props;

    return (
      <PanelContainer>
        <PlaylistContainer>
          <PlaylistDescription>
            <PlaylistName>
                {playlist.name}
            </PlaylistName>
            <PlaylistDetails>
              <PlaylistState>
                {this.renderPlaylistState()}
              </PlaylistState>
              <Link to={`/channel/${playlist.channel.id}`}>
                {playlist.channel.name}
              </Link>
              <div style={{ marginRight: '.5em'}}>
                <Label>
                  סרטון {currVideoIndex+1} מתוך {playlist && playlist.videos.length}
                </Label>
              </div>
            </PlaylistDetails>
          </PlaylistDescription>
        </PlaylistContainer>
        <VideosContainer>
          {playlist.videos.length && currVideoIndex > -1 ?
            <List items={playlist.videos} data-is-scrollable="true" onRenderCell={ (item, index) => 
              <PlaylistVideoCard item={item} index={index} currindex={currVideoIndex} playlistId={playlist.id}/>
            } />
             : null }
        </VideosContainer>
      </PanelContainer>
    );
  }
}

export default PlaylistPanel;