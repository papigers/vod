import React from 'react';
import styled, { css } from 'styled-components';
import { Flex, Box } from 'grid-styled';
import { Link } from 'react-router-dom';
import {
  DocumentCard,
  DocumentCardActivity,
  DocumentCardPreview,
  DocumentCardTitle,
  DocumentCardType,
} from 'office-ui-fabric-react/lib/DocumentCard';
import { Shimmer,ShimmerElementType as ElemType, ShimmerElementsGroup } from 'office-ui-fabric-react/lib/Shimmer';

const CardContainer = styled.div`
  margin-bottom: 16px;
  ${({ type }) => type === DocumentCardType.compact ? css`
    margin-left: 0;
  ` : css`
    margin-left: 12px;
    flex-basis: 212px;
  `}
  
  .ms-DocumentCardPreview {
    width: 208px;
    height: 118px;
  }
`;

const StyledVideoCard = styled(DocumentCard)`
  && {
    min-width: ${({ type }) => type === DocumentCardType.compact ? '360px' : 'inherit'};
  }
  .ms-DocumentCardTitle {
    box-sizing: content-box;
  }
  &.ms-DocumentCard:not(.ms-DocumentCard--compact) {
    width: 210px;
  }
  &.ms-DocumentCard--compact {
    height: 120px;

    .ms-DocumentCardPreview {
      max-width: none;
      max-height: 118px;
    }
    .ms-DocumentCardTitle {
      height: 60px;
    }
  }
`;

function LoadingCardContent(compact) {
  return (
    <Flex style={ {height: compact ? 118 : 86 }}>
        <ShimmerElementsGroup
          shimmerElements={[{ type: ElemType.gap, height: compact ? 118 : 86, width: 16 }]}
        />
        <Box width={1}>
          <Flex flexWrap="wrap">
            <ShimmerElementsGroup
              flexWrap
              width="100%"
              shimmerElements={[
                { type: ElemType.gap, width: '100%', height: 0 },
                { type: ElemType.line, width: '100%', height: 14, verticalAlign: 'top' },
                compact ? { type: ElemType.line, width: '90%', height: 14, verticalAlign: 'bottom' } : null, 
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
                  shimmerElements={[{ type: ElemType.circle, height: 40 }, { type: ElemType.gap, width: 10, height: 40 }]}
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
          shimmerElements={[{ type: ElemType.gap, height: compact ? 118 : 86, width: 16 }]}
        />
      </Flex>
  );
}

export default function VideoCard(props) {
  const { compact, loading, video } = props;

  const showShimmer = loading || !video;

  const LinkOnLoad = video ? Link : 'div';

  return (
    <CardContainer type={compact ? DocumentCardType.compact : DocumentCardType.normal}>
      <LinkOnLoad to={video && `/watch?v=${video.id}`}>
        <StyledVideoCard onClick={() => null} type={compact ? DocumentCardType.compact : DocumentCardType.normal}>
          <Shimmer
            shimmerElements={[
              { type: ElemType.line, width: 210, height: 118 },
            ]}
            width="100%"
            isDataLoaded={!showShimmer}
          >
            <DocumentCardPreview previewImages={[{
                previewImageSrc: video && `${process.env.REACT_APP_STREAMER_HOSTNAME}/${video.id}/thumbnail.png`,
                width: compact ? null : 208,
                height: compact ? 118 : null,
              }]}
            />
          </Shimmer>
          <div className="ms-DocumentCard-details">
            <Shimmer
              customElementsGroup={LoadingCardContent(compact)}
              width='100%'
              isDataLoaded={!showShimmer}
            >
              {video && <DocumentCardTitle
                title={video.name}
                shouldTruncate
              />}
              <LinkOnLoad to={video && `/channel/${video.channel.id}`}>
                <DocumentCardActivity
                  activity={video && `הועלה ב: ${(new Date(video.createdAt)).toLocaleString()}`}
                  people={video && [{ name: video.channel.name, profileImageSrc: video.channel.picture }]}
                />
              </LinkOnLoad>
            </Shimmer>
          </div>
        </StyledVideoCard>
      </LinkOnLoad>
    </CardContainer>
  );
}
