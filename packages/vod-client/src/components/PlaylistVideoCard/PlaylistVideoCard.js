import React, { Component } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

import { Image } from 'office-ui-fabric-react/lib/Image';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

const CardContainer = styled(Link)`
  min-height: 54px;
  padding: 4px 0 4px 8px;
  box-sizing: border-box;
  display: flex;
  border-bottom: ${({ compact, theme }) =>
    !compact ? `1px solid ${theme.palette.neutralTertiaryAlt}` : null};

  &:hover {
    background-color: ${({ compact, theme }) =>
      !compact ? theme.palette.neutralLighterAlt : null};
    border-top-color: ${({ compact, theme }) => (!compact ? theme.palette.neutralLighter : null)};
  }
`;

const CardThumbnail = styled(Image)`
  flex-shrink: 0;
  position: relative;
  margin: 3px 0;
`;

const CardContent = styled.div`
  padding: 0 8px;
  overflow: hidden;
  flex-grow: 1;
`;

const VideoName = styled.h3`
  font-weight: unset;
  text-overflow: ellipsis;
  margin: 0;
  padding: 8px 0;
`;

const CompactVideoName = styled.h4`
  font-weight: unset;
  text-overflow: ellipsis;
  margin: 0;
  padding: 12px 0 2px 0;
`;

const SubTitle = styled.div`
  font-size: small;
  color: ${({ theme }) => theme.palette.neutralTertiary};
  margin: 0;
`;

class PlaylistVideoCard extends Component {
  render() {
    const { item, index, currindex, playlistId, compact } = this.props;

    return (
      <CardContainer compact={compact} to={item && `/watch?v=${item.id}&list=${playlistId}`}>
        <div style={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SubTitle>
            {currindex === index ? <Icon iconName={'CaretSolidLeft'} /> : index + 1}
          </SubTitle>
        </div>
        <CardThumbnail
          src={item && `${window._env_.REACT_APP_STREAMER_HOSTNAME}/${item.id}/thumbnail.png`}
          width={compact ? 100 : 120}
        />
        <CardContent>
          {compact ? (
            <CompactVideoName>{item.name}</CompactVideoName>
          ) : (
            <VideoName>{item.name}</VideoName>
          )}
          <SubTitle>{item.channel.name}</SubTitle>
        </CardContent>
      </CardContainer>
    );
  }
}

export default PlaylistVideoCard;
