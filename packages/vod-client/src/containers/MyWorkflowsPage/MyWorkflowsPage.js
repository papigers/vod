import React, { Component } from 'react';
import { createStructuredSelector } from 'reselect';
import { Box, Flex } from 'grid-styled';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectUser } from 'containers/Root/selectors';

import { Pivot, PivotItem, PivotLinkSize } from 'office-ui-fabric-react/lib/Pivot';

import SubmittedWorkflows from 'components/SubmittedWorkflows';

const Container = styled(Flex)`
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

class MyWorkflowsPage extends Component {
  constructor() {
    super();
    this.state = {
      activeTab: 'all',
    };
  }

  onLinkClick = item => {
    this.setState({
      activeTab: item.props.itemKey,
    });
  };

  render() {
    return (
      <Container flexDirection="column">
        <Helmet>
          <title>VOD - הבקשות שלי</title>
        </Helmet>
        <TitleBox>
          <CategoryHeader>הבקשות שלי</CategoryHeader>
          <Pivot linkSize={PivotLinkSize.large} headersOnly onLinkClick={this.onLinkClick}>
            <PivotItem itemIcon="DocumentSet" linkText="הכל" itemKey="all" />
            <PivotItem itemIcon="Document" linkText="ממתין לאישור" itemKey="inprogress" />
            <PivotItem itemIcon="DocumentApproval" linkText="אושר" itemKey="approved" />
          </Pivot>
        </TitleBox>
        <SubmittedWorkflows type={this.state.activeTab} />
      </Container>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

export default createReduxContainer(MyWorkflowsPage, mapStateToProps);
