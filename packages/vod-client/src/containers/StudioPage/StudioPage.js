import React, { Component } from 'react';
import { createStructuredSelector } from 'reselect';
import { Box, Flex } from 'grid-styled';
import styled from 'styled-components';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectUser } from 'containers/ChannelPage/selectors';

import { Pivot, PivotItem, PivotLinkSize } from 'office-ui-fabric-react/lib/Pivot';

import StudioVideos from 'components/StudioVideos';
import StudioAnalytics from 'components/StudioAnalytics';
import StudioPlaylists from 'components/StudioPlaylists';

const StudioContainer = styled(Flex)`
  height: calc(100vh - 64px);
  transition: width 300ms ease-in-out;
  box-sizing: border-box;
  overflow: auto;
`;

const TitleBox = styled(Box).attrs(() => ({
  pr: 30,
  pl: 30,
}))`
  background-color: ${({ theme }) => theme.palette.neutralLighter};
`;

const CategoryHeader = styled.h2`
  display: inline-block;
`;

class StudioPage extends Component {
  constructor() {
    super();
    this.state = {
      activeTab: 'videos',
    };
  }

  renderTab() {
    const { activeTab } = this.state;
    const { user } = this.props;

    let Component = 'span';
    let props = { user };

    switch (activeTab) {
      case 'videos':
        Component = StudioVideos;
        break;
      case 'playlists':
        Component = StudioPlaylists;
        break;
      case 'analytics':
        Component = StudioAnalytics;
        break;
      default:
        props.children = 404;
    }
    return React.createElement(Component, props);
  }

  onLinkClick = item => {
    this.setState({
      activeTab: item.props.itemKey,
    });
  };

  render() {
    return (
      <StudioContainer flexDirection="column">
        <Flex flexDirection="column" style={{ position: 'relative', height: '100%' }}>
          <TitleBox>
            <CategoryHeader>{'סטודיו'}</CategoryHeader>
            <Pivot linkSize={PivotLinkSize.large} headersOnly onLinkClick={this.onLinkClick}>
              <PivotItem itemIcon="MSNVideos" linkText="סרטונים" itemKey="videos" />
              <PivotItem itemIcon="Stack" linkText="פלייליסטים" itemKey="playlists" />
              <PivotItem itemIcon="AnalyticsView" linkText="אנליטיקות" itemKey="analytics" />
            </Pivot>
          </TitleBox>
          {this.renderTab()}
        </Flex>
      </StudioContainer>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

export default createReduxContainer(StudioPage, mapStateToProps);
