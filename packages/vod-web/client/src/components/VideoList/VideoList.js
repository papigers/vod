import React from 'react';
import styled from 'styled-components';
import VideoCard from '../VideoCard';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';

export const VIDEO_LIST_TYPE = {
  GRID: 'GRID_VIDEO_LIST',
  VERTICAL: 'VERTICAL_VIDEO_LIST',
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
  const { category, type } = props;
  return (
    <div>
      {category ? <CategoryHeader>{category}</CategoryHeader> : null}
      <ThumbnailList type={type}>
        {[1,2,3,4,5,6,7,8,9,10].map(k => <VideoCard compact={type !== VIDEO_LIST_TYPE.GRID} key={k} />)}
      </ThumbnailList>
      <PrimaryButton text="עוד" />
    </div>
  );
}

VideoList.defaultProps = {
  type: VIDEO_LIST_TYPE.GRID,
};
