import React, { Component } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Box } from 'grid-styled';

import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

import VideoCard from 'components/VideoCard';
import VideoList, { VIDEO_LIST_TYPE } from 'components/VideoList';
import { margin } from 'polished';

const PanelContainer = styled.div`

  .vjs-hide-button {
    display: none;
  }
`;

const PlaylistContainer = styled.div`
  position: relative;
  background: ${({ theme }) => theme.palette.neutralLight};
  /* color: ${({ theme }) => theme.palette.themePrimary}; */
  padding-bottom: 5px;
  width: 100%;
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
                    </Label>)
            case 'UNLISTED':
                return (
                    <Label>
                        <Icon iconName="Link" /> קישור בלבד
                    </Label>)
            default:
                return (
                    <Label>
                        <Icon iconName="Error" /> 404
                    </Label>)
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
                {playlist.videos.length ?
                 <VideoList
                    videos={playlist.videos}
                    loading={this.props.loadingRelated}
                    type={VIDEO_LIST_TYPE.LIST}
                    /> : null}
            </PanelContainer>
        );
    }
}

export default PlaylistPanel;