import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { createStructuredSelector } from 'reselect';
import { Switch, Route, Redirect } from 'react-router-dom';
import { bindActionCreators } from 'redux';

import Header from 'components/Header';
import Sidebar from 'components/Sidebar';
import Modal from 'components/Modal';
import NewChannelForm from 'components/NewChannelForm';

import HomePage from 'containers/HomePage';
import VideoPage from 'containers/VideoPage';
import UploadPage from 'containers/UploadPage';
import ChannelPage from 'containers/ChannelPage';
import VideoPreloader from 'containers/VideoPreloader';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectSidebar, makeSelectChannelModal } from './selectors';
import { makeSelectUser, makeSelectFollowedChannels } from '../ChannelPage/selectors';
import * as actions from './actions';


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

class App extends Component {
  componentDidMount() {
    this.props.getManagedChannels();
    this.props.getFollowedChannels();
  }

  render() {
    const {
      toggleSidebarOpen,
      toggleChannelModalOpen,
      channelModalOpen,
      sidebar: {
        open: isSidebarOpen,
        trapped: isSidebarTrapped,
      },
      user,
      followed,
    } = this.props;

    return (
      <Fragment>
        <VideoPreloader />
        <Header
          toggleSidebar={toggleSidebarOpen}
          toggleChannelModalOpen={toggleChannelModalOpen}
          user={user}
        />
        <Container>
          <Sidebar followedChannels={followed} isSidebarOpen={isSidebarOpen} isSidebarTrapped={isSidebarTrapped} onDismissed={toggleSidebarOpen} />
          <Content addSidebarMargin={isSidebarOpen && isSidebarTrapped}>
            <Switch>
              <Route exact path="/" component={HomePage} />
              <Route exact path="/channel" component={ChannelPage} />
              <Route exact path="/channel/:channelId" component={ChannelPage} />
              <Route exact path="/watch" component={VideoPage} />
              <Route exact path="/upload" component={UploadPage} />
              <Redirect to="/" />
            </Switch>
          </Content>
        </Container>
        <Modal isOpen={channelModalOpen} title="יצירת ערוץ" onDismiss={toggleChannelModalOpen}>
          <NewChannelForm user={user} onSubmit={this.props.getManagedChannels} />
        </Modal>
      </Fragment>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  sidebar: makeSelectSidebar(),
  channelModalOpen: makeSelectChannelModal(),
  user: makeSelectUser(),
  followed: makeSelectFollowedChannels(),
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(actions, dispatch);
};

export default createReduxContainer(App, mapStateToProps, mapDispatchToProps);
