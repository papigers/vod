import React from 'react';
import styled from 'styled-components';
import { Box } from 'grid-styled';
import VideoCard from '../VideoCard';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';

export const VIDEO_LIST_TYPE = {
  GRID: 'GRID_VIDEO_LIST',
  LIST: 'VERTICAL_VIDEO_LIST',
  ROW: 'ROW_VIDEO_LIST', // not implemented yet
};

export const ThumbnailList = styled.div`
  display: flex;
  flex-wrap: ${({ type }) => (type === VIDEO_LIST_TYPE.GRID ? 'wrap' : 'nowrap')};
  flex-direction: ${({ type }) => (type === VIDEO_LIST_TYPE.GRID ? 'row' : 'column')};
`;

const CategoryHeader = styled.h2`
  display: inline-block;
`;

function pageCountDefault(pageCount, type) {
  if (pageCount) {
    return pageCount;
  }
  switch (type) {
    case VIDEO_LIST_TYPE.LIST:
      return 10;
    case VIDEO_LIST_TYPE.ROW:
      return 10;
    case VIDEO_LIST_TYPE.GRID:
    default:
      return 10;
  }
}

export default function VideoList(props) {
  const { category, type, videos, loading, pageCount } = props;

  let realCount = pageCountDefault(pageCount, type);
  const showPlaceholder = loading || !videos;
  return (
    <Box pb={16}>
      {category ? <CategoryHeader>{category}</CategoryHeader> : null}
      <ThumbnailList type={type}>
        {!showPlaceholder
          ? videos.map(video => (
              <VideoCard compact={type !== VIDEO_LIST_TYPE.GRID} item={video} key={video.id} />
            ))
          : Array.from(Array(realCount).keys()).map(k => (
              <VideoCard compact={type !== VIDEO_LIST_TYPE.GRID} loading key={k} />
            ))}
      </ThumbnailList>
      {!loading && videos && videos.length ? <PrimaryButton text="עוד" /> : null}
    </Box>
  );
}

VideoList.defaultProps = {
  type: VIDEO_LIST_TYPE.GRID,
};
