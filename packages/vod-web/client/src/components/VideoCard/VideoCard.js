import React from 'react';
import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  DocumentCard,
  DocumentCardActivity,
  DocumentCardPreview,
  DocumentCardTitle,
  DocumentCardType,
} from 'office-ui-fabric-react/lib/DocumentCard';

const CardContainer = styled.div`
  margin-bottom: 16px;
  ${({ type }) => type === DocumentCardType.compact ? css`
    margin-left: 0;
  ` : css`
    margin-left: 12px;
    flex-basis: 212px;
  `}
  
  .ms-DocumentCardPreview {
      width: 210px;
      height: 118px;
    }
`;

const StyledVideoCard = styled(DocumentCard)`
  && {
    min-width: ${({ type }) => type === DocumentCardType.compact ? '360px' : 'inherit'};
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

export default function VideoCard(props) {
  const { compact } = props;

  return (
    <CardContainer type={compact ? DocumentCardType.compact : DocumentCardType.normal}>
      <Link to="/watch?v=9lUnK5wfdFIL">
        <div>
        <StyledVideoCard onClick={() => null} type={compact ? DocumentCardType.compact : DocumentCardType.normal}>
          <DocumentCardPreview previewImages={[
            {
              // previewImageSrc: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg?sqp=-oaymwEZCNACELwBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLCALyvNJwgrtG1GpHFugkV0e3jqdg',
              previewImageSrc: `${process.env.REACT_APP_STREAMER_HOSTNAME}/b0PCWLt690M9/thumbnail.png`,
              // width: compact ? 240 : 215,
              width: compact ? null : 210,
              height: compact ? 118 : null,
            }
          ]} />
          <div className="ms-DocumentCard-details">
            <DocumentCardTitle
              title="אביתר בנאי - עד מתי"
              shouldTruncate
            />
            <DocumentCardActivity
              activity="העלה לפני כמה דקות"
              people={[{ name: 'גרשון פפיאשוילי', profileImageSrc: 'https://scontent.ftlv5-1.fna.fbcdn.net/v/t1.0-9/36404826_10212689636864924_812286978346188800_n.jpg?_nc_cat=0&oh=691bf8c0957e2ba052de6a1eb9ef5c08&oe=5BD4C941' }]}
            />
          </div>
        </StyledVideoCard>
        </div>
      </Link>
    </CardContainer>
  );
}
