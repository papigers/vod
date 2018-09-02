import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { transitions } from 'polished';
import { Box, Flex } from 'grid-styled';
import axios from 'axios';

import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Pivot, PivotItem, PivotLinkSize } from 'office-ui-fabric-react/lib/Pivot';
import { Shimmer, ShimmerElementType as ElemType, ShimmerElementsGroup } from 'office-ui-fabric-react/lib/Shimmer';

import VideoList from 'components/VideoList';


const ContentBox = styled(Box).attrs({
  pr: 100,
  pl: 30,
})``;

const TitleBox = ContentBox.extend`
  .ms-Shimmer-shimmerWrapper {
    background: ${({theme}) => `linear-gradient(to left, ${theme.palette.neutralLight} 0%, ${theme.palette.neutralQuaternaryAlt} 50%, ${theme.palette.neutralLight} 100%) 0px 0px / 90% 100% no-repeat ${theme.palette.neutralQuaternaryAlt}`};
  }

  &, .ms-ShimmerGap-root {
    background-color: ${({theme}) => theme.palette.neutralLighterAlt};
    border-color: ${({theme}) => theme.palette.neutralLighterAlt};
  }
  .ms-ShimmerLine-root, .ms-ShimmerCircle-root {
    border-color: ${({theme}) => theme.palette.neutralLighterAlt};
    svg {
      fill: ${({theme}) => theme.palette.neutralLighterAlt};
    }
  }
`;

const ChannelPivot = styled(Pivot)`
  .ms-Pivot-linkContent {
    min-width: 110px;
  }

  .ms-Pivot-link:before {
    border-bottom-width: 4px;
    ${transitions('background-color 0.267s cubic-bezier(0.1, 0.25, 0.75, 0.9)', 'left 0.267s cubic-bezier(0.1, 0.25, 0.75, 0.9)', 'right 0.267s cubic-bezier(0.1, 0.25, 0.75, 0.9)', 'border 0.267s cubic-bezier(0.1, 0.25, 0.75, 0.9)')}
  }
  .ms-Pivot-link:not(.is-selected):before {
    left: 50%;
    right: 50%;
  }
`

export default class Channel extends Component {

  constructor() {
    super();
    this.state = {
      uploads: [],
      loading: true,
    };
  }

  componentDidMount() {
    this.fetchUploads();
  }

  componentDidUpdate(prevProps) {
    if (this.props.channel && (this.props.channel.id !== (prevProps.channel && prevProps.channel.id))) {
      this.fetchUploads();
    }
  }

  fetchUploads = () => {
    const { channel, loading } = this.props;

    if (channel && !loading) {
      axios.get(`${process.env.REACT_APP_API_HOSTNAME}/api/channels/${channel.id}/videos`)
      .then(({ data }) => {
        this.setState({
          uploads: data,
          loading: false,
        });
      })
      .catch(console.error); 
    }
  };

  render() {
    const { channel, loading } = this.props;
    const { loading: loadingVideos } = this.state;

    return (
      <Fragment>
        <Shimmer
          width="100%"
          shimmerElements={[
            { type: ElemType.line, width: '100%', height: 280 },
          ]}
          isDataLoaded={!!channel}
        >
          {channel && <Image height={280} src={`/profile/${channel.id}/cover.png`} imageFit={ImageFit.cover} maximizeFrame />}
        </Shimmer>
        <TitleBox>
          <Box py={20}>
            <Shimmer
              customElementsGroup={(
                <Box width={1}>
                  <Flex>
                    <ShimmerElementsGroup
                      shimmerElements={[
                        { type: ElemType.circle, height: 100 },
                        { type: ElemType.gap, width: 16, height: 100 }
                      ]}
                    />
                    <ShimmerElementsGroup
                      flexWrap
                      width={'calc(100% - 100px)'}
                      shimmerElements={[
                        { type: ElemType.gap, width: '100%', height: 25 },
                        { type: ElemType.line, width: '50%', height: 20 },
                        { type: ElemType.gap, width: '50%', height: 20 },
                        { type: ElemType.line, width: '30%', height: 16 },
                        { type: ElemType.gap, width: '70%', height: 16 },
                        { type: ElemType.gap, width: '100%', height: 25 },
                      ]}
                    />
                  </Flex>
                </Box>
              )}
              width="100%"
              isDataLoaded={!!channel}
            >
              {channel && (
                <Persona
                  imageUrl={`/profile/${channel.id}/profile.png`}
                  primaryText={channel.name}
                  secondaryText={channel.description}
                  size={PersonaSize.size72}
                />
              )}
            </Shimmer>
          </Box>
          <ChannelPivot linkSize={PivotLinkSize.large} headersOnly>
            <PivotItem linkText="בית" />
            <PivotItem linkText="סרטונים" />
            <PivotItem linkText="פלייליסטים" />
            <PivotItem itemIcon="Search" />
          </ChannelPivot>
        </TitleBox>
        <ContentBox>
          <VideoList category="העלאות" loading={loading || loadingVideos} videos={this.state.uploads} />
        </ContentBox>
      </Fragment>
    );
  }
}
