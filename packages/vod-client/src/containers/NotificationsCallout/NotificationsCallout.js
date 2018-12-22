import React, { Component } from 'react';
import styled from 'styled-components';
import { Box } from 'grid-styled';
import Waypoint from 'react-waypoint';
import { createStructuredSelector } from 'reselect';
import { bindActionCreators } from 'redux';

import { Callout } from 'office-ui-fabric-react/lib/Callout';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import Notification from 'components/Notification';
import createReduxContainer from 'utils/createReduxContainer';

import {
  makeSelectNotifications,
  makeSelectNotificationsError,
  makeSelectNotificationsLoading,
} from './selectors';
import { makeSelectUser } from '../ChannelPage/selectors';
import * as actions from './actions';

const ContentPadding = styled(Box).attrs({
  p: 12,
})([]);

const ScrollableContent = styled.div`
  overflow-y: auto;
  max-height: 450px;
`;

class NotificationsCallout extends Component {
  componentDidMount() {
    this.props.getNotifications();
  }

  fetchNotifications = () => this.props.getNotifications(true);

  onDismiss = () => {
    if (this.props.calloutProps.onDismiss) {
      this.props.calloutProps.onDismiss();
    }

    this.props.readNotifications();
  };

  render() {
    const { calloutProps, notifications, error, loading, user } = this.props;
    const lastNotificationKey = notifications.length
      ? notifications[notifications.length - 1].groupId
      : null;
    return (
      <Callout {...calloutProps} onDismiss={this.onDismiss}>
        <ContentPadding>
          <div className="ms-font-l">נוטיפיקציות</div>
        </ContentPadding>
        <ScrollableContent>
          {error ? <ContentPadding>{error}</ContentPadding> : null}
          {notifications.map(not => (
            <Notification {...not} user={user} onDismiss={this.onDismiss} />
          ))}
          {loading ? (
            <ContentPadding>
              <Spinner label="טוען..." size={SpinnerSize.large} />
            </ContentPadding>
          ) : null}
          <Waypoint key={lastNotificationKey} onEnter={this.fetchNotifications} />
        </ScrollableContent>
      </Callout>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  notifications: makeSelectNotifications(),
  error: makeSelectNotificationsError(),
  loading: makeSelectNotificationsLoading(),
  user: makeSelectUser(),
});

const mapDispatchToProps = dispatch => {
  return bindActionCreators(actions, dispatch);
};

export default createReduxContainer(NotificationsCallout, mapStateToProps, mapDispatchToProps);
