import React from 'react';
import styled from 'styled-components';
import { transparentize } from 'polished';

import { Link } from 'react-router-dom';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { CommandBarButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';

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

function ButtonLink(props) {
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
            imageUrl="https://scontent.fhfa1-1.fna.fbcdn.net/v/t1.0-1/p480x480/36404826_10212689636864924_812286978346188800_n.jpg?_nc_cat=0&oh=f7b5d42c81a822f2a2e642abb2fafe4c&oe=5C0E4A2A"
            size={PersonaSize.size32}
            text="גרשון ח פפיאשוילי"
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

function SubMenuLink(props, dismiss) {
  const { to, channel, onRender, ...other } = props;
  if (to.indexOf('/channel') !== -1 && to !== '/channel/new') {
    return (
      <StyledSubMenuButton {...other}>
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

export default function Header(props) {
  return (
    <HeaderContainer>
      <HeaderGroup>
        <HeaderLogo toggleSidebar={props.toggleSidebar} />
      </HeaderGroup>
      <SearchGroup>
        <StyledSearchBox placeholder="חיפוש" />
      </SearchGroup>
      <HeaderGroup>
        <ThemeContext.Consumer>
          {({ theme, toggleTheme }) => (
            <StyledCommandBar buttonAs={ButtonLink} items={[{
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
                  {
                    key: 'channel11',
                    to: '/channel/channel11',
                    channel: {
                      name: 'ערוץ 11',
                      picture: 'https://yt3.ggpht.com/-BbwsM-6h7Qg/AAAAAAAAAAI/AAAAAAAAAAA/S-9eysJS6os/s288-mo-c-c0xffffffff-rj-k-no/photo.jpg',
                    },
                    onRender: SubMenuLink,
                  },
                  {
                    key: 'divider_1',
                    itemType: ContextualMenuItemType.Divider
                  },
                  {
                    key: 'createChannel',
                    to: '/channel/new',
                    text: 'צור ערוץ',
                    iconProps: {
                      iconName: 'AddGroup'
                    },
                    onRender: SubMenuLink,
                  },
                ],
              },
            }]} />
          )}
        </ThemeContext.Consumer>
      </HeaderGroup>
    </HeaderContainer>
  );
}
