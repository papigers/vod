import React from 'react';
import styled from 'styled-components';
import { Box } from 'grid-styled';
import VideoCard from '../VideoCard';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';

export const VIDEO_LIST_TYPE = {
  GRID: 'GRID_VIDEO_LIST',
  LIST: 'VERTICAL_VIDEO_LIST',
};

const ThumbnailList = styled.div`
  display: flex;
  flex-wrap: ${({ type }) => type === VIDEO_LIST_TYPE.GRID ? 'wrap' : 'nowrap'};
  flex-direction: ${({ type }) => type === VIDEO_LIST_TYPE.GRID ? 'row' : 'column'};
`;

const CategoryHeader = styled.h2`
  display: inline-block;
`;

export default function VideoList(props) {
  const { category, type, videos, loading } = props;

  const showPlaceholder = loading || !videos;
  console.log(loading, videos);
  return (
    <Box pb={16}>
      {category ? <CategoryHeader>{category}</CategoryHeader> : null}
      <ThumbnailList type={type}>
        {!showPlaceholder ? (
          videos.map(video => <VideoCard compact={type !== VIDEO_LIST_TYPE.GRID} video={video} key={video.id} />)
        ) : (
          [1,2,3,4,5,6,7,8,9,10].map(k => <VideoCard compact={type !== VIDEO_LIST_TYPE.GRID} loading key={k} />)
        )}
      </ThumbnailList>
      {!loading && videos && videos.length ? <PrimaryButton text="עוד" /> : null}
    </Box>
  );
}

VideoList.defaultProps = {
  type: VIDEO_LIST_TYPE.GRID,
};
