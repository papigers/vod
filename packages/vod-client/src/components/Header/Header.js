import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Box } from 'grid-styled';
import { transparentize, clearFix } from 'polished';

import { Link } from 'react-router-dom';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { CommandBarButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { TooltipHost, Tooltip, DirectionalHint } from 'office-ui-fabric-react/lib/Tooltip';

import HeaderLogo from 'components/HeaderLogo';
import NotificationsCallout from 'containers/NotificationsCallout';
import { ThemeContext } from 'theme';

const HeaderContainer = styled.div`
  padding: 12px 10px;
  box-shadow: 0 0 10px 1px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1001;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: ${({ theme }) =>
    theme.name === 'light' ? theme.palette.bodyBackground : theme.palette.neutralLighterAlt};
`;

const HeaderGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin: 0 12px;

  &:first-child {
    margin-right: 0;
  }

  &:last-child {
    margin-left: 0;
  }
`;

const SearchGroup = styled(HeaderGroup)`
  flex-grow: 1;
  max-width: 550px;

  & > div {
    flex-grow: 1;
  }
`;

const StyledSearchBox = styled(SearchBox)`
  height: 40px;
  font-size: 16px;
`;

export const StyledCommandBar = styled(CommandBar)`
  .ms-CommandBar {
    background-color: transparent;
  }

  .ms-Button-icon {
    font-size: 19px;
  }

  .ms-Button--commandBar {
    background-color: transparent;
    height: 100%;

    &:hover {
      background-color: ${({ theme }) => transparentize(0.96, theme.palette.neutralPrimary)};
    }
  }
`;

const StyledChannelButton = styled(CommandBarButton)`
  .ms-Persona-details {
    padding-left: 8px;
    padding-right: 8px;
  }

  .ms-Persona {
    padding: 0 4px;
  }

  &.ms-Button {
    padding: 0;
    border: 0;
  }

  .ms-Persona,
  a {
    height: 100%;
  }

  .ms-Button-menuIcon {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    padding: 0 4px;
    position: relative;

    &::after {
      content: '';
      display: block;
      height: 20px;
      width: 1px;
      position: absolute;
      top: calc(50% - 10px);
      left: 100%;
      background-color: ${({ theme }) => theme.palette.neutralLight};
    }
  }

  &:hover .ms-Persona:not(:hover),
  &:hover .ms-Button-menuIcon:not(:hover) {
    background-color: ${({ theme }) => transparentize(0.45, theme.palette.white)};
  }
`;

const StyledSubMenuButton = styled(DefaultButton)`
  width: 100%;
  background-color: transparent;
  padding: 0 6px;

  &:hover {
    background-color: ${({ theme }) => transparentize(0.95, theme.palette.neutralPrimary)};
  }

  a {
    width: 100%;
  }

  .ms-Persona-primaryText {
    overflow: visible;
  }

  .ms-Persona-details {
    padding-right: 5px;
  }

  .ms-Button-label {
    font-weight: normal;
    text-align: right;
  }

  .ms-Button-icon {
    color: ${({ theme }) => theme.palette.themeSecondary};
  }
`;

const StyledSpinnerContainer = styled(Box)`
  ${clearFix()}
  display: flex;

  .ms-Spinner {
    float: right;
    display: flex;
    margin-right: 5px;
  }

  .ms-Label {
    float: right;
    margin-right: 5px;
  }
`;

const NotificationTooltip = styled(Tooltip)`
  width: 20px;
  height: 20px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border-color: #f8f8f8;
  background-color: ${({ theme }) => theme.palette.themeSecondary};
  box-shadow: ${({ theme }) => theme.palette.blackTranslucent40} 0 0 5px 0;
  color: #f8f8f8;

  .ms-Callout-main {
    background: transparent;
  }
`;

const HeaderButtons = styled(StyledCommandBar).attrs({
  as: 'div',
})`
  display: flex;
  padding: 0 16px;
  height: 40px;
`;

const HeaderButton = styled.div`
  height: 100%;
`;

export default class Header extends Component {
  constructor() {
    super();
    this.state = {
      notifCalloutOpen: false,
    };
    this.notificationRef = React.createRef();
  }

  toggleNotificationCallout = () =>
    this.setState({ notifCalloutOpen: !this.state.notifCalloutOpen });

  renderHeaderButton = props => {
    const {
      to,
      tooltip,
      notifications,
      itemRef,
      text,
      iconOnly,
      tooltipHostProps,
      ...other
    } = props;

    let component = <CommandBarButton text={!iconOnly ? text : undefined} {...other} />;

    if (to && to.indexOf('/channel') !== -1) {
      component = (
        <StyledChannelButton {...other}>
          <Link to={to}>
            <Persona
              imageUrl={`/profile/${this.props.user && this.props.user.id}/profile.png`}
              size={PersonaSize.size32}
              text={this.props.user && this.props.user.name}
            />
          </Link>
        </StyledChannelButton>
      );
    } else if (to) {
      component = <Link to={to}>{component}</Link>;
    }

    component = <HeaderButton innerRef={itemRef}>{component}</HeaderButton>;

    if (iconOnly && text !== undefined) {
      component = (
        <TooltipHost content={text} {...tooltipHostProps}>
          {component}
        </TooltipHost>
      );
    }

    return component;
  };

  renderSubMenuLink = (props, dismiss) => {
    const { to, channel, onRender, ...other } = props;
    if (to.indexOf('/channel') !== -1) {
      return (
        <StyledSubMenuButton {...other} onClick={dismiss}>
          <Link to={to}>
            <Persona imageUrl={channel.picture} size={PersonaSize.size24} text={channel.name} />
          </Link>
        </StyledSubMenuButton>
      );
    }
    return (
      <Link to={to} onClick={dismiss}>
        <StyledSubMenuButton {...other} />
      </Link>
    );
  };

  renderLoadingSpinner(props) {
    return (
      <StyledSpinnerContainer p="1px" py="2px">
        <Spinner size={SpinnerSize.medium} {...props} />
        <Label>טוען ערוצים... </Label>
      </StyledSpinnerContainer>
    );
  }

  onSearch = query => {
    const trimmed = `${query}`.trim();
    if (trimmed.length) {
      this.props.onSearch(trimmed);
    }
  };

  getHeaderButtons = ({ theme, toggleTheme }) => {
    const { user, toggleChannelModalOpen } = this.props;

    const managedChannelsLinks =
      user && user.managedChannels
        ? user.managedChannels.map(channel => ({
            key: channel.id,
            to: `/channel/${channel.id}`,
            channel: {
              name: channel.name,
              picture: `/profile/${channel.id}/profile.png`,
            },
            onRender: this.renderSubMenuLink,
          }))
        : [
            {
              key: 'loading-channels',
              onRender: this.renderLoadingSpinner,
            },
          ];

    return [
      {
        key: 'upload',
        text: 'העלאה',
        to: '/upload',
        iconProps: {
          iconName: 'Upload',
        },
      },
      {
        key: 'studio',
        text: 'סטודיו',
        to: '/studio',
        iconProps: {
          iconName: 'MyMoviesTV',
        },
      },
      {
        key: 'night',
        text: theme.name === 'light' ? 'מצב לילה' : 'מצב יום',
        onClick: toggleTheme,
        iconProps: {
          iconName: theme.name === 'light' ? 'ClearNight' : 'Brightness',
        },
        iconOnly: true,
      },
      {
        key: 'notifications',
        text: 'נוטיפיקציות',
        onClick: this.toggleNotificationCallout,
        iconOnly: true,
        iconProps: {
          iconName: 'Ringer',
        },
        itemRef: this.notificationRef,
      },
      {
        key: 'channel',
        text: 'הערוץ שלי',
        to: '/channel',
        iconOnly: true,
        menuProps: {
          items: [
            ...managedChannelsLinks,
            {
              key: 'divider_1',
              itemType: ContextualMenuItemType.Divider,
            },
            {
              key: 'createChannel',
              to: '/channel/new',
              onClick: toggleChannelModalOpen,
              text: 'צור ערוץ',
              iconProps: {
                iconName: 'AddGroup',
              },
            },
          ],
        },
      },
    ];
  };

  render() {
    const { toggleSidebar, unreadNotifications } = this.props;

    return (
      <HeaderContainer>
        <HeaderGroup>
          <HeaderLogo toggleSidebar={toggleSidebar} />
        </HeaderGroup>
        <SearchGroup>
          <StyledSearchBox placeholder="חיפוש" onSearch={this.onSearch} />
        </SearchGroup>
        <HeaderGroup>
          <ThemeContext.Consumer>
            {themeContext => (
              <Fragment>
                <HeaderButtons>
                  {this.getHeaderButtons(themeContext).map(this.renderHeaderButton)}
                </HeaderButtons>
                {this.notificationRef.current && unreadNotifications ? (
                  <NotificationTooltip
                    content={unreadNotifications}
                    calloutProps={{
                      isBeakVisible: false,
                      coverTarget: true,
                      directionalHint: DirectionalHint.topLeftEdge,
                    }}
                    targetElement={this.notificationRef.current}
                  />
                ) : null}
                {this.state.notifCalloutOpen ? (
                  <NotificationsCallout
                    calloutProps={{
                      target: this.notificationRef.current,
                      onDismiss: this.toggleNotificationCallout,
                      directionalHint: DirectionalHint.bottomRightEdge,
                      isBeakVisible: true,
                      setInitialFocus: true,
                      directionalHintFixed: true,
                      calloutWidth: 500,
                      preventDismissOnScroll: true,
                    }}
                  />
                ) : null}
              </Fragment>
            )}
          </ThemeContext.Consumer>
        </HeaderGroup>
      </HeaderContainer>
    );
  }
}
