import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { createStructuredSelector } from 'reselect';
import { Switch, Route, Redirect } from 'react-router-dom';
import { bindActionCreators } from 'redux';

import Header from 'components/Header';
import Results from 'components/Results';
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
import { makeSelectUnreadNotificationCount } from '../NotificationsCallout/selectors';
import { makeSelectUser, makeSelectFollowedChannels } from '../ChannelPage/selectors';
import * as actions from './actions';
import { getNotifications } from '../NotificationsCallout/actions';

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
    this.props.getUser()
      .then(() => {
        this.props.getManagedChannels();
        this.props.getFollowedChannels();
      });
    this.props.getNotifications();
  }

  onSearch = query => {
    this.props.history.push(`/results?query=${query}`);
  }

  render() {
    const {
      toggleSidebarOpen,
      toggleChannelModalOpen,
      channelModalOpen,
      unreadNotifications,
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
          onSearch={this.onSearch}
          unreadNotifications={unreadNotifications}
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
              <Route exact path="/results" component={Results} />
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
  unreadNotifications: makeSelectUnreadNotificationCount(),
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    ...actions,
    getNotifications,
  }, dispatch);
};

export default createReduxContainer(App, mapStateToProps, mapDispatchToProps);
