import React, { Component } from 'react';
import { createStructuredSelector } from 'reselect';
import { Box, Flex } from 'grid-styled';
import styled from 'styled-components';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectUser } from 'containers/Root/selectors';

import PendingWorkflows from 'components/PendingWorkflows';

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

const CategoryHeader = styled.h1`
  display: inline-block;
`;

class WorkflowsPage extends Component {
  render() {
    return (
      <Container flexDirection="column">
        <TitleBox>
          <CategoryHeader>בקשות לאישור</CategoryHeader>
        </TitleBox>
        <PendingWorkflows />
      </Container>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

export default createReduxContainer(WorkflowsPage, mapStateToProps);
