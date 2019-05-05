import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import { Flex, Box } from 'grid-styled';
import debounce from 'debounce';
import { Link } from 'react-router-dom';
import { transparentize } from 'polished';

import {
  DocumentCard,
  DocumentCardPreview,
  DocumentCardDetails,
  DocumentCardActivity,
  DocumentCardTitle,
  DocumentCardType,
} from 'office-ui-fabric-react/lib/DocumentCard';
import {
  Shimmer,
  ShimmerElementType as ElemType,
  ShimmerElementsGroup,
} from 'office-ui-fabric-react/lib/Shimmer';
import { Overlay } from 'office-ui-fabric-react/lib/Overlay';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

import { withPreload } from 'containers/VideoPreloader';

const CardContainer = styled.div`
  margin-bottom: 16px;
  ${({ type }) =>
    type === DocumentCardType.compact
      ? css`
          margin-left: 0;
        `
      : css`
          margin-left: 12px;
          flex-basis: 212px;
        `}

  .ms-DocumentCardPreview {
    max-width: fit-content;
  }
`;

const StyledVideoCard = styled(DocumentCard)`
  && {
    min-width: ${({ type }) => (type === DocumentCardType.compact ? '360px' : 'inherit')};
  }

  .ms-DocumentCardDetails {
    height: fit-content;

    .ms-DocumentCardTitle {
      margin: 5px 0;
      padding: 0 8px 0 24px;
    }
  }

  .ms-DocumentCardActivity {
    transition: background-color 200ms ease-in-out, border 200ms ease-in-out;
    border-top: 2px solid transparent;
    padding-bottom: 5px;

    &:hover {
      background-color: ${({ theme }) => theme.palette.neutralLighterAlt};
      border-top-color: ${({ theme }) => theme.palette.neutralLighter};
    }
  }

  &.ms-DocumentCard:not(.ms-DocumentCard--compact) {
    width: 210px;
  }

  &.ms-DocumentCard--compact {
    height: fit-content;
  }
`;

const LikeBox = styled(Flex)`
  padding: 0 6px;
  font-size: 12px;
  position: absolute;
  left: 0;
  bottom: 0;
  background: ${({ theme }) => transparentize(0.4, theme.palette.white)};

  i {
    padding-left: 6px;
    color: ${({ theme }) => theme.palette.themeDarkAlt};
    margin-top: 1px;
  }
`;

const PlaylistOverlay = styled.div`
  background-color: black;
  display: flex;
  position: relative;
  align-content: center;
  width: 50%;
  height: 100%;
  opacity: 0.5;
  font-size: xx-large;
  color: white;
  flex-direction: column;
`;

const PlaylistCount = styled.p`
  margin: 15px 30px 0;
`;

const PlaylistLogo = styled(Icon)`
  margin: 0 30px;
`;

function LoadingCardContent(compact) {
  return (
    <Flex style={{ height: compact ? 95 : 86 }}>
      <ShimmerElementsGroup
        shimmerElements={[{ type: ElemType.gap, height: compact ? 95 : 86, width: 16 }]}
      />
      <Box width={1}>
        <Flex flexWrap="wrap">
          <ShimmerElementsGroup
            flexWrap
            width="100%"
            shimmerElements={[
              { type: ElemType.gap, width: '100%', height: 0 },
              { type: ElemType.line, width: '100%', height: 0, verticalAlign: 'top' },
              compact
                ? { type: ElemType.line, width: '90%', height: 14, verticalAlign: 'bottom' }
                : null,
              compact ? { type: ElemType.gap, width: '10%', height: 10 } : null,
            ].filter(el => !!el)}
          />
          <Box width={1}>
            <Flex flexWrap="wrap">
              <ShimmerElementsGroup
                width="100%"
                shimmerElements={[{ type: ElemType.gap, width: '100%', height: compact ? 20 : 8 }]}
              />
              <ShimmerElementsGroup
                shimmerElements={[
                  { type: ElemType.circle, height: 40 },
                  { type: ElemType.gap, width: 10, height: 40 },
                ]}
              />
              <ShimmerElementsGroup
                flexWrap={true}
                width="calc(100% - 50px)"
                shimmerElements={[
                  { type: ElemType.line, width: '100%', height: 12, verticalAlign: 'bottom' },
                  { type: ElemType.line, width: '90%', height: 10 },
                  { type: ElemType.gap, width: '10%', height: 20 },
                ]}
              />
              <ShimmerElementsGroup
                width="100%"
                shimmerElements={[{ type: ElemType.gap, width: '100%', height: compact ? 0 : 6 }]}
              />
            </Flex>
          </Box>
        </Flex>
      </Box>
      <ShimmerElementsGroup
        shimmerElements={[{ type: ElemType.gap, height: compact ? 95 : 86, width: 16 }]}
      />
    </Flex>
  );
}

class VideoCard extends Component {
  constructor() {
    super();
    this.onHover = debounce(this.onHover, 500).bind(this);
  }

  onHover() {
    const { preload, item } = this.props;
    if (item && item.id) {
      preload(Object.keys(item).includes('videos') ? item.videos[0].id : item.id);
    }
  }

  render() {
    const { compact, loading, item } = this.props;

    const showShimmer = loading || !item;
    const LinkOnLoad = item ? Link : 'div';

    return (
      <CardContainer
        onMouseOver={this.onHover}
        type={compact ? DocumentCardType.compact : DocumentCardType.normal}
      >
        <LinkOnLoad
          to={
            item
              ? Object.keys(item).includes('videos')
                ? `/watch?v=${item.videos[0].id}&list=${item.id}`
                : `/watch?v=${item.id}`
              : null
          }
        >
          <StyledVideoCard
            onClick={() => null}
            type={compact ? DocumentCardType.compact : DocumentCardType.normal}
          >
            <Shimmer
              shimmerElements={[{ type: ElemType.line, width: 210, height: 95 }]}
              width="100%"
              isDataLoaded={!showShimmer}
            >
              <DocumentCardPreview
                previewImages={[
                  {
                    previewImageSrc:
                      item &&
                      `${process.env.REACT_APP_STREAMER_HOSTNAME}/${
                        Object.keys(item).includes('videos') ? item.videos[0].id : item.id
                      }/thumbnail.png`,
                    width: compact ? null : 210,
                    height: compact ? 95 : null,
                  },
                ]}
              />
              {item && Object.keys(item).includes('videos') && (
                <Overlay>
                  <PlaylistOverlay>
                    <PlaylistCount>{item.videos.length}</PlaylistCount>
                    <PlaylistLogo iconName={'Stack'} />
                  </PlaylistOverlay>
                </Overlay>
              )}
              {item && (
                <LikeBox alignItems="center">
                  <Icon iconName="LikeSolid" />
                  {item.likeCount}
                </LikeBox>
              )}
            </Shimmer>
            <DocumentCardDetails>
              <Shimmer
                customElementsGroup={LoadingCardContent(compact)}
                width="100%"
                isDataLoaded={!showShimmer}
              >
                {item && <DocumentCardTitle title={item.name} shouldTruncate />}
                <LinkOnLoad to={item && `/channel/${item.channel.id}`}>
                  {item && (
                    <DocumentCardActivity
                      activity={item && `${item.viewCount} צפיות`}
                      people={
                        item && [
                          {
                            name: item.channel.name,
                            profileImageSrc: `/profile/${item.channel.id}/profile.png`,
                          },
                        ]
                      }
                    />
                  )}
                </LinkOnLoad>
              </Shimmer>
            </DocumentCardDetails>
          </StyledVideoCard>
        </LinkOnLoad>
      </CardContainer>
    );
  }
}

export default withPreload(VideoCard);
