import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { transitions } from 'polished';
import { Box } from 'grid-styled';

import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Pivot, PivotItem, PivotLinkSize } from 'office-ui-fabric-react/lib/Pivot';
import { Shimmer, ShimmerElementType as ElemType } from 'office-ui-fabric-react/lib/Shimmer';

import VideoList from 'components/VideoList';
import ChannelRow from 'containers/ChannelRow';
import axios from 'utils/axios';
import ChannelSettings from 'components/ChannelSettings';

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
      followDelta: 0,
      activeTab: 'home',
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
    this.setState({
      uploads: [],
      loading: true,
    });

    if (channel && !loading) {
      axios.get(`/channels/${channel.id}/videos`)
      .then(({ data }) => {
        this.setState({
          uploads: data,
          loading: false,
        });
      })
      .catch(console.error);
    }
  };

  onLinkClick = (item)  => {
    this.setState({ activeTab: item.props.itemKey });
  }

  renderTab() {
    const { loading, channel, user } = this.props;
    const { loading: loadingVideos, activeTab , uploads} = this.state;
    
    switch (activeTab) {
      case 'home':
        return (
          <VideoList category="העלאות" loading={loading || loadingVideos} videos={uploads} />
        );
      case 'videos':
        return (
          <span>videos</span>
        );
      case 'playlists':
        return (
          <span>playlists</span>
        );
      case 'search':
        return (
          <span>search</span>
        );
      case 'settings':
        return (
          <ChannelSettings user={user} channel={channel} />
        );
      default:
          return (
            <span>404</span>
          );
    }
  }

  render() {
    const { channel, user  } = this.props;

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
            <ChannelRow channel={channel} user={user} />
          </Box>
          <ChannelPivot linkSize={PivotLinkSize.large} headersOnly onLinkClick={this.onLinkClick}>
            <PivotItem linkText="בית" itemKey='home' />
            <PivotItem linkText="סרטונים" itemKey='videos' />
            <PivotItem linkText="פלייליסטים" itemKey='playlists' />
            <PivotItem itemIcon="Search" itemKey="search" />
            {(channel && (channel.canManage || user.id === channel.id)) ? (
              <PivotItem itemIcon="Settings" itemKey="settings" />
            ) : <div/>}
          </ChannelPivot>
        </TitleBox>
        <ContentBox>
          {this.renderTab()}
        </ContentBox>
      </Fragment>
    );
  }
}
