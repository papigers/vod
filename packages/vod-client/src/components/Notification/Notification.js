import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Image } from 'office-ui-fabric-react/lib/Image';

const NotificationPersona = styled(Persona)`
  .ms-Persona-tertiaryText {
    display: block;
  }
`;

const NotificationButton = styled(Box).attrs({
  p: 12,
})`
  cursor: pointer;
  background-color: ${({ theme, unread }) =>
    unread ? theme.palette.themeLighterAlt : 'transparent'};

  &:hover {
    background-color: ${({ theme, unread }) =>
      unread ? theme.palette.themeLighter : theme.palette.neutralLighterAlt};
  }
`;

const NotificationBold = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.themeDark};
`;

const NotificationUnread = styled.div`
  visibility: ${({ unread }) => (unread ? 'visible' : 'hidden')};
  width: 14px;
  height: 14px;
  border-radius: 7px;
  border: 1px solid;
  border-color: #fff;
  background-color: ${({ theme }) => theme.palette.themeSecondary};
  box-shadow: ${({ theme }) => theme.palette.blackTranslucent40} 0 0 5px 0;
`;

class Notification extends Component {
  getNotificationText = () => {
    const { type, senders, video, comment } = this.props;
    let text = '';
    let end;
    switch (type) {
      case 'VIDEO_COMMENT':
        end = `"${comment.video.name}"`;
        if (senders.length > 2) {
          text = (
            <span>
              <NotificationBold>{senders[0].name}</NotificationBold> ו-
              <NotificationBold>{senders.length - 1}</NotificationBold> אנשים נוספים הגיבו לסרטון{' '}
              {end}
            </span>
          );
        } else if (senders.length > 1) {
          text = (
            <span>
              <NotificationBold>{senders[0].name}</NotificationBold> ו
              <NotificationBold>{senders[1].name}</NotificationBold> הגיבו לסרטון {end}
            </span>
          );
        } else {
          text = (
            <span>
              <NotificationBold>{senders[0].name}</NotificationBold> הגיב לסרטון {end}
            </span>
          );
        }
        break;
      case 'VIDEO_LIKE':
        end = `"${video.name}"`;
        if (senders.length > 2) {
          text = (
            <span>
              <NotificationBold>{senders[0].name}</NotificationBold> ו-
              <NotificationBold>{senders.length - 1}</NotificationBold> אנשים נוספים אהבו את הסרטון{' '}
              {end}
            </span>
          );
        } else if (senders.length > 1) {
          text = (
            <span>
              <NotificationBold>{senders[0].name}</NotificationBold> ו
              <NotificationBold>{senders[1].name}</NotificationBold> אהבו את הסרטון {end}
            </span>
          );
        } else {
          text = (
            <span>
              <NotificationBold>{senders[0].name}</NotificationBold> אהב את הסרטון {end}
            </span>
          );
        }
        break;
      case 'UPLOAD_FINISH':
        end = `${video.name}`;
        text = (
          <span>
            סרטון הועלה בהצלחה: "<NotificationBold>{end}</NotificationBold>"
          </span>
        );
        break;
      case 'CHANNEL_FOLLOW':
        if (senders.length > 2) {
          text = (
            <span>
              <NotificationBold>{senders[0].name}</NotificationBold> ו-
              <NotificationBold>{senders.length - 1}</NotificationBold> אנשים נוספים התחילו לעקוב
              אחריך
            </span>
          );
        } else if (senders.length > 1) {
          text = (
            <span>
              <NotificationBold>{senders[0].name}</NotificationBold> ו
              <NotificationBold>{senders[1].name}</NotificationBold> התחילו לעקוב אחריך
            </span>
          );
        } else {
          text = (
            <span>
              <NotificationBold>{senders[0].name}</NotificationBold> התחיל לעקוב אחריך
            </span>
          );
        }
        break;
      default:
        text = type;
    }
    return text;
  };

  getSecondaryText = () => {
    const { type, video, channel, comment, user } = this.props;
    switch (type) {
      case 'VIDEO_LIKE':
      case 'UPLOAD_FINISH':
      case 'UPLOAD_ERROR':
        return user.id === video.channel.id ? 'הערוץ שלך' : video.channel.name;
      case 'VIDEO_COMMENT':
        return user.id === comment.video.channel.id ? 'הערוץ שלך' : comment.video.channel.name;
      case 'CHANNEL_FOLLOW':
        return user.id === channel.id ? 'הערוץ שלך' : channel.name;
      default:
        return null;
    }
  };

  getNotificationLink = () => {
    switch (this.props.type) {
      case 'VIDEO_LIKE':
        return `/watch?v=${this.props.video.id}`;
      case 'VIDEO_COMMENT':
        return `/watch?v=${this.props.comment.video.id}`;
      case 'CHANNEL_FOLLOW':
        return `/channel/${this.props.senders[0].id}`;
      case 'UPLOAD_FINISH':
        return `/watch?v=${this.props.video.id}`;
      default:
        return null;
    }
  };

  getNotificationPreview = () => {
    switch (this.props.type) {
      case 'VIDEO_LIKE':
        return `${process.env.REACT_APP_STREAMER_HOSTNAME}/${this.props.video.id}/thumbnail.png`;
      case 'VIDEO_COMMENT':
        return `${process.env.REACT_APP_STREAMER_HOSTNAME}/${
          this.props.comment.video.id
        }/thumbnail.png`;
      case 'CHANNEL_FOLLOW':
      default:
        return null;
    }
  };

  render() {
    const { type, senders, createdAt, unread, onDismiss } = this.props;
    return (
      <Link to={this.getNotificationLink()} onClick={onDismiss}>
        <NotificationButton unread={unread}>
          <Flex justifyContent="space-between" alignItems="center">
            <NotificationPersona
              size={PersonaSize.size40}
              text={type}
              onRenderPrimaryText={this.getNotificationText}
              onRenderSecondaryText={this.getSecondaryText}
              tertiaryText={new Date(createdAt).toLocaleString()}
              imageUrl={`/profile/${senders[0].id}/profile.png`}
            />
            <Flex justifyContent="space-between" alignItems="center">
              <Image height={40} src={this.getNotificationPreview()} />
              <Box px="6px" />
              <NotificationUnread unread={unread} />
            </Flex>
          </Flex>
        </NotificationButton>
      </Link>
    );
  }
}

export default Notification;
