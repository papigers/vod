import React, { Component } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

import { Image } from 'office-ui-fabric-react/lib/Image';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

const CardContainer = styled(Link)`
    min-height: 54px;
    padding: 4px 0px 4px 8px;
    box-sizing: border-box;
    display: flex;
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

const VideoName = styled.h4`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  padding: 8px 0;
`;

const SubTitle = styled.p`
  font-size: small;
  color: ${({ theme }) => theme.palette.neutralTertiary};
  padding: 8px 0;
  margin: 0;
`;

class PlaylistVideoCard extends Component {
  render() {
    const { item, index, currindex, playlistId } = this.props;

    return (
      <CardContainer to={item && `/watch?v=${item.id}&list=${playlistId}`}>
          <div style={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <SubTitle>
              {currindex === index ? <Icon iconName={'CaretSolidLeft'} /> : index + 1 }
            </SubTitle>
          </div>
          <CardThumbnail src={item && `${process.env.REACT_APP_STREAMER_HOSTNAME}/${item.id}/thumbnail.png`} height={56} />
          <CardContent>
            <VideoName>{item.name}</VideoName>
            <SubTitle>{item.channel.name}</SubTitle>
          </CardContent>
      </CardContainer>
    );
  }
}

export default PlaylistVideoCard;