import React, { Component } from 'react';
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

import HeaderLogo from 'components/HeaderLogo';
import { ThemeContext } from 'theme';

const HeaderContainer = styled.div`
  padding: 12px 10px;
  box-shadow: 0px 0px 10px 1px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: ${({theme}) => theme.name === 'light' ? theme.palette.bodyBackground : theme.palette.neutralLighterAlt};
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

const SearchGroup = HeaderGroup.extend`
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
  background-color: transparent;

  .ms-Button--commandBar {
    background-color: transparent;

    &:hover {
      background-color: ${({theme}) => transparentize(0.96, theme.palette.neutralPrimary)};
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

  .ms-Persona, a {
    height: 100%;
  }

  &:hover .ms-Persona:not(:hover),
  &:hover .ms-Button-menuIcon:not(:hover) {
    background-color: ${({theme}) => transparentize(0.45, theme.palette.white)};
  }

  .ms-Button-menuIcon {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    padding: 0 4px;
    position: relative;
    &:after {
      content: '';
      display: block;
      height: 20px;
      width: 1px;
      position: absolute;
      top: calc(50% -10px);
      left: 100%;
      background-color: ${({theme}) => theme.palette.neutralLight};
    }
  }
`;

const StyledSubMenuButton = styled(DefaultButton)`
  width: 100%;
  background-color: transparent;
  padding: 0 6px;

  &:hover {
    background-color: ${({theme}) =>transparentize(0.95, theme.palette.neutralPrimary)};
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
    color: ${({theme}) => theme.palette.themeSecondary};
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

export default class Header extends Component {
  renderHeaderButton = (props) => {
    const { to, ...other } = props;
    
    if (!to) {
      return (
        <CommandBarButton {...other} />
      );
    }
    else if (to.indexOf('/channel') !== -1) {
      return (
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
    }
    return (
      <Link to={to}>
        <CommandBarButton {...other} />
    </Link>
    );
  }

  renderSubMenuLink = (props, dismiss) => {
    const { to, channel, onRender, ...other } = props;
    if (to.indexOf('/channel') !== -1) {
      return (
        <StyledSubMenuButton {...other} onClick={dismiss}>
          <Link to={to}>
            <Persona
              imageUrl={channel.picture}
              size={PersonaSize.size24}
              text={channel.name}
            />
          </Link>
        </StyledSubMenuButton>
      );
    }
    return (
      <Link to={to} onClick={dismiss}>
        <StyledSubMenuButton {...other} />
      </Link>
    );
  }

  renderLoadingSpinner(props) {
    return (
      <StyledSpinnerContainer p="1px" py="2px">
        <Spinner size={SpinnerSize.medium} {...props}/>
        <Label>טוען ערוצים... </Label>
      </StyledSpinnerContainer>
    );
  }

  onSearch = (query) => {
    const trimmed = `${query}`.trim();
    if (trimmed.length) {
      this.props.onSearch(trimmed);
    }
  }

  render() {
    const {
      user,
      toggleSidebar,
      toggleChannelModalOpen,
    } = this.props;

    const managedChannelsLinks = user && user.managedChannels ? (
      user.managedChannels.map((channel) => ({
        key: channel.id,
        to: `/channel/${channel.id}`,
        channel: {
          name: channel.name,
          picture: `/profile/${channel.id}/profile.png`,
        },
        onRender: this.renderSubMenuLink,
      }))
    ) : ([{
      key: 'loading-channels',
      onRender: this.renderLoadingSpinner,
    }]);

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
            {({ theme, toggleTheme }) => (
              <StyledCommandBar buttonAs={this.renderHeaderButton} items={[{
                key: 'night',
                name: theme.name === 'light' ? 'מצב לילה' : 'מצב יום',
                onClick: toggleTheme,
                iconProps: {
                  iconName: theme.name === 'light' ? 'ClearNight' : 'Brightness',
                },
                iconOnly: true,
              }, {
                key: 'upload',
                name: 'העלאה',
                to: '/upload',
                iconProps: {
                    iconName: 'Upload'
                },
              }, {
                key: 'channel',
                name: 'הערוץ שלי',
                to: '/channel',
                iconOnly: true,
                subMenuProps: {
                  items: [
                    ...managedChannelsLinks,
                    {
                      key: 'divider_1',
                      itemType: ContextualMenuItemType.Divider
                    },
                    {
                      key: 'createChannel',
                      to: '/channel/new',
                      onClick: toggleChannelModalOpen,
                      text: 'צור ערוץ',
                      iconProps: {
                        iconName: 'AddGroup'
                      },
                    },
                  ],
                },
              }, {
                key: 'studio',
                name: 'סטודיו',
                to: '/studio',
                iconProps: {
                  iconName: 'MyMoviesTV'
                },
              }]} />
            )}
          </ThemeContext.Consumer>
        </HeaderGroup>
      </HeaderContainer>
    );
  }
}
