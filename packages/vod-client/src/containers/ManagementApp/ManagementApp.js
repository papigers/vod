import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Switch, Route, Redirect } from 'react-router-dom';
import { createStructuredSelector } from 'reselect';
import { Helmet } from 'react-helmet';

import { makeSelectUser } from 'containers/Root/selectors';
import { makeSelectSidebar } from 'containers/App/selectors';
import Header from 'components/MgmtHeader';
import MgmtSidebar from 'components/MgmtSidebar';
import Home from 'containers/MgmtHomeDashboard';
import createReduxContainer from 'utils/createReduxContainer';
import MyWorkflowsPage from '../MyWorkflowsPage';
import WorkflowsPage from '../WorkflowsPage';
import WorkflowPage from '../WorkflowPage';
import LoadCreditPage from '../LoadCreditPage';
import CreditBalancePage from '../CreditBalancePage';

const Container = styled.div`
  display: flex;
`;

const Content = styled.div`
  margin-right: ${({ addSidebarMargin }) => (addSidebarMargin ? '240px' : 0)};
  flex-grow: 1;
  min-height: calc(100vh - 50px);
  transition: margin 0.1s ease-in-out;
  margin-top: 50px;
  height: calc(100vh - 50px);
  overflow-y: auto;
`;

class ManagementApp extends Component {
  render() {
    const {
      sidebar: { open: isSidebarOpen, trapped: isSidebarTrapped },
      user,
    } = this.props;

    return (
      <Fragment>
        <Helmet>
          <title>VOD - ניהול</title>
        </Helmet>
        <Header user={user} />
        <Container>
          <MgmtSidebar isSidebarOpen={isSidebarOpen} isSidebarTrapped={isSidebarTrapped} />
          <Content addSidebarMargin={isSidebarOpen && isSidebarTrapped}>
            <Switch>
              <Route exact path="/mgmt/workflows" component={WorkflowsPage} />
              <Route exact path="/mgmt/my-workflows" component={MyWorkflowsPage} />
              <Route exact path="/mgmt/workflows/:id" component={WorkflowPage} />
              <Route exact path="/mgmt/credit/load" component={LoadCreditPage} />
              <Route exact path="/mgmt/credit/balance" component={CreditBalancePage} />
              <Redirect from="/mgmt/credit" to="/mgmt/credit/balance" />
              <Route exact path="/mgmt" component={Home} />
            </Switch>
          </Content>
        </Container>
      </Fragment>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  sidebar: makeSelectSidebar(),
  user: makeSelectUser(),
});

export default createReduxContainer(ManagementApp, mapStateToProps);
