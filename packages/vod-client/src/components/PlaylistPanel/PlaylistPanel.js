import React, { Component } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

import { Label } from 'office-ui-fabric-react/lib/Label';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { List } from 'office-ui-fabric-react/lib/List';
import { ScrollablePane, ScrollbarVisibility } from 'office-ui-fabric-react/lib/ScrollablePane';

import PlaylistVideoCard from 'components/PlaylistVideoCard';

const PanelContainer = styled.div`
  height: 0;
  width: 100%;
  padding-top: 104.25%;
  position: relative;
  margin-bottom: 20px;

  & > div {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
  }
`;

const PlaylistContainer = styled.div`
  position: relative;
  background: ${({ theme }) => theme.palette.neutralLight};
`;

const VideosContainer = styled.div`
  background: ${({ theme }) => theme.palette.neutralLighter};
  position: relative;
  flex: 1 1 0;
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

  .ms-Label {
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

  .ms-Label {
    padding: 0;
  }
`;

class PlaylistPanel extends Component {
  renderPlaylistState = () => {
    switch (this.props.playlist.state) {
      case 'PUBLISHED':
        return (
          <Label>
            <Icon iconName="RedEye" /> פומבי
          </Label>
        );
      case 'UNLISTED':
        return (
          <Label>
            <Icon iconName="Link" /> קישור בלבד
          </Label>
        );
      case 'PRIVATE':
      default:
        return (
          <Label>
            <Icon iconName="Hide" /> פרטי
          </Label>
        );
    }
  };

  render() {
    const { playlist, currVideoIndex } = this.props;

    return (
      <PanelContainer>
        <div>
          <PlaylistContainer>
            <PlaylistDescription>
              <PlaylistName>
                <Link to={`/playlist?list=${playlist.id}`}>{playlist.name}</Link>
              </PlaylistName>
              <PlaylistDetails>
                <PlaylistState>{this.renderPlaylistState()}</PlaylistState>
                <Link to={`/channel/${playlist.channel.id}`}>{playlist.channel.name}</Link>
                <div style={{ marginRight: '.5em' }}>
                  <Label>
                    סרטון {currVideoIndex + 1} מתוך {playlist && playlist.videos.length}
                  </Label>
                </div>
              </PlaylistDetails>
            </PlaylistDescription>
          </PlaylistContainer>
          <VideosContainer>
            {playlist.videos.length ? (
              <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
                <List
                  items={playlist.videos}
                  data-is-scrollable="true"
                  scrollToIndex={currVideoIndex}
                  onRenderCell={(item, index) => (
                    <PlaylistVideoCard
                      item={item}
                      index={index}
                      currindex={currVideoIndex}
                      playlistId={playlist.id}
                      compact={true}
                    />
                  )}
                />
              </ScrollablePane>
            ) : null}
          </VideosContainer>
        </div>
      </PanelContainer>
    );
  }
}

export default PlaylistPanel;
