import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { createStructuredSelector } from 'reselect';
import { Switch, Route, Redirect } from 'react-router-dom';
import { bindActionCreators } from 'redux';

import Header from 'components/Header';
import Sidebar from 'components/Sidebar';
import VideoList, { VIDEO_LIST_TYPE } from 'components/VideoList';
import Modal from 'components/Modal';
import NewChannelForm from 'components/NewChannelForm';

import VideoPage from 'containers/VideoPage';
import UploadPage from 'containers/UploadPage';
import ChannelPage from 'containers/ChannelPage';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectSidebar, makeSelectChannelModal } from './selectors';
import { toggleSidebarOpen, toggleChannelModalOpen } from './actions';

const Container = styled.div`
  display: flex;
`;

const Content = styled.div`
  margin-right: ${({ addSidebarMargin }) => addSidebarMargin ? '240px' : 0};
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
      toggleChannelModalOpen,
      channelModalOpen,
      sidebar: {
        open: isSidebarOpen,
        trapped: isSidebarTrapped,
      },
    } = this.props;

    return (
      <Fragment>
        <Header toggleSidebar={toggleSidebarOpen} toggleChannelModalOpen={toggleChannelModalOpen} />
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
        <Modal isOpen={channelModalOpen} title="יצירת ערוץ" onDismiss={toggleChannelModalOpen}>
          <NewChannelForm />
        </Modal>
      </Fragment>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  sidebar: makeSelectSidebar(),
  channelModalOpen: makeSelectChannelModal(),
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    toggleSidebarOpen,
    toggleChannelModalOpen,
  }, dispatch);
};

export default createReduxContainer(App, mapStateToProps, mapDispatchToProps);
