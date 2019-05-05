import React, { Component } from 'react';
import styled from 'styled-components';
import { transparentize } from 'polished';
import { Link } from 'react-router-dom';
import { Flex } from 'grid-styled';

import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { CommandBarButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Callout } from 'office-ui-fabric-react/lib/Callout';

import HeaderLogo from 'components/MgmtLogo';
import { ThemeContext } from 'theme';

const HeaderContainer = styled.div`
  height: 50px;
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
    theme.name === 'light' ? theme.palette.black : theme.palette.neutralLighterAlt};
`;

const HeaderGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin: 0 12px;
  height: 100%;

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
  height: 32px;
  font-size: 14px;
`;

export const StyledCommandBar = styled(CommandBar)`
  .ms-CommandBar {
    background-color: transparent;
  }

  .ms-Button-icon {
    font-size: 18px;
    color: #fff;
  }

  .ms-Button--commandBar {
    background-color: transparent;
    height: 100%;
    width: 100%;

    &:hover {
      background-color: ${({ theme }) => transparentize(0.8, '#fff')};
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

  .ms-Persona-primaryText,
  &:hover .ms-Persona-primaryText {
    color: #fff;
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
`;

const HeaderButtons = styled(StyledCommandBar).attrs(() => ({
  as: 'div',
}))`
  display: flex;
  height: 100%;
`;

const HeaderButton = styled.div`
  height: 100%;
  min-width: 50px;
  text-align: center;

  &:first-child {
    border-right: 1px solid ${transparentize(0.7, '#fff')};
  }

  & + & {
    border-right: 1px solid ${transparentize(0.7, '#fff')};

    .ms-Button--commandBar {
      padding-right: 6px;
    }
  }
`;

const WaffleButton = styled(PrimaryButton)`
  width: 100px;
  height: 100px;
  margin: 8px 4px;

  &:first-child {
    margin-right: 8px;
  }

  &:last-child {
    margin-left: 8px;
  }

  .ms-Button-flexContainer {
    flex-direction: column;

    .ms-Button-icon {
      flex-grow: 1;
      font-size: 38px;
      line-height: 38px;
      display: flex;
      align-items: center;
    }

    .ms-Button-textContainer {
      flex-grow: 0.2;
    }
  }
`;

export default class Header extends Component {
  constructor() {
    super();
    this.state = {
      calloutOpen: false,
    };
    this.calloutRef = React.createRef();
  }

  toggleCallout = () => this.setState({ calloutOpen: !this.state.calloutOpen });

  renderHeaderButton = props => {
    const {
      to,
      tooltip,
      notifications,
      itemRef,
      text,
      iconOnly,
      tooltipHostProps,
      key,
      ...other
    } = props;

    let component = <CommandBarButton key={key} text={!iconOnly ? text : undefined} {...other} />;

    if (key === 'channel') {
      component = (
        <StyledChannelButton key={key} {...other}>
          <Persona
            imageUrl={`/profile/${this.props.user && this.props.user.id}/profile.png`}
            size={PersonaSize.size32}
            text={this.props.user && this.props.user.name}
          />
        </StyledChannelButton>
      );
    } else if (to) {
      component = (
        <Link key={key} to={to}>
          {component}
        </Link>
      );
    }

    component = (
      <HeaderButton key={key} ref={itemRef}>
        {component}
      </HeaderButton>
    );

    return component;
  };

  onSearch = query => {
    const trimmed = `${query}`.trim();
    if (trimmed.length) {
      console.log('search', trimmed);
      // this.props.onSearch(trimmed);
    }
  };

  getHeaderButtons = ({ theme, toggleTheme }) => {
    return [
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
        key: 'channel',
        text: 'הערוץ שלי',
        iconOnly: true,
      },
    ];
  };

  render() {
    return (
      <HeaderContainer>
        <HeaderGroup>
          <HeaderLogo ref={this.calloutRef} toggleCallout={this.toggleCallout} />
          {this.state.calloutOpen ? (
            <Callout
              target={this.calloutRef.current}
              onDismiss={this.toggleCallout}
              gapSpace={0}
              setInitialFocus
              beakWidth={10}
              minPagePadding={26}
            >
              <Flex>
                <Link to="/">
                  <WaffleButton iconProps={{ iconName: 'MSNVideosSolid' }}>האתר הראשי</WaffleButton>
                </Link>
                <Link to="/studio">
                  <WaffleButton iconProps={{ iconName: 'MyMoviesTV' }}>סטודיו</WaffleButton>
                </Link>
              </Flex>
            </Callout>
          ) : null}
        </HeaderGroup>
        <SearchGroup>
          <StyledSearchBox placeholder="חיפוש" onSearch={this.onSearch} />
        </SearchGroup>
        <HeaderGroup>
          <ThemeContext.Consumer>
            {themeContext => (
              <HeaderButtons>
                {this.getHeaderButtons(themeContext).map(this.renderHeaderButton)}
              </HeaderButtons>
            )}
          </ThemeContext.Consumer>
        </HeaderGroup>
      </HeaderContainer>
    );
  }
}
