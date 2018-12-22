import React from 'react';
import styled from 'styled-components';
import { Shimmer, ShimmerElementType as ElemType } from 'office-ui-fabric-react/lib/Shimmer';
import { Image } from 'office-ui-fabric-react/lib/Image';

const ThumbnailContainer = styled.div`
  display: inline-block;
  margin-top: 4px;
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'default')};
  box-shadow: ${({ theme }) => `0 0 4px 3px ${theme.palette.neutralQuaternaryAlt}`};
  transition: box-shadow 150ms ease-in-out, margin 150ms ease-in-out;

  &:hover {
    box-shadow: ${({ theme }) => `0 0 2px 4px ${theme.palette.neutralTertiaryAlt}`};
  }

  & + & {
    margin-top: 6px;
  }
`;

export default function VideoThumbnail({ src, width, height, onClick }) {
  return (
    <div>
      <ThumbnailContainer onClick={onClick}>
        {src ? (
          <Image width={width} height={height} src={src} />
        ) : (
          <Shimmer shimmerElements={[{ type: ElemType.line, width, height }]} width={width} />
        )}
      </ThumbnailContainer>
    </div>
  );
}
