import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { createStructuredSelector } from 'reselect';
import { Switch, Route, Redirect } from 'react-router-dom';
import { bindActionCreators } from 'redux';

import Header from 'components/Header';
import Sidebar from 'components/Sidebar';
import VideoList, { VIDEO_LIST_TYPE } from 'components/VideoList';

import VideoPage from 'containers/VideoPage';
import UploadPage from 'containers/UploadPage';
import ChannelPage from 'containers/ChannelPage';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectSidebar } from './selectors';
import { toggleSidebarOpen } from './actions';

const Container = styled.div`
  display: flex;
`;

const Content = styled.div`
  margin-right: ${({ addSidebarMargin }) => addSidebarMargin ? '240px' : 0};
  /* padding: 20px; */
  /* padding-top: 24px; */
  flex-grow: 1;
  min-height: calc(100vh - 64px);
  transition: margin 0.1s ease-in-out;
  margin-top: 64px;
`;

const Videos = () => <VideoList category="מומלצים" type={VIDEO_LIST_TYPE.GRID} />;

class App extends Component {
  render() {
    const {
      toggleSidebarOpen,
      sidebar: {
        open: isSidebarOpen,
        trapped: isSidebarTrapped,
      },
    } = this.props;

    return (
      <Fragment>
        <Header toggleSidebar={toggleSidebarOpen} />
        <Container>
          <Sidebar isSidebarOpen={isSidebarOpen} isSidebarTrapped={isSidebarTrapped} onDismissed={toggleSidebarOpen} />
          <Content addSidebarMargin={isSidebarOpen && isSidebarTrapped}>
            <Switch>
              <Route exact path="/" component={Videos} />
              <Route exact path="/channel" component={ChannelPage} />
              <Route exact path="/channel/:channelId" component={ChannelPage} />
              <Route exact path="/watch" component={VideoPage} />
              <Route exact path="/upload" component={UploadPage} />
              <Redirect to="/" />
            </Switch>
          </Content>
        </Container>
      </Fragment>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  sidebar: makeSelectSidebar(),
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    toggleSidebarOpen,
  }, dispatch);
};

export default createReduxContainer(App, mapStateToProps, mapDispatchToProps);
