import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';
import { transparentize } from 'polished';

import { CommandBarButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Link } from 'react-router-dom';
import { Callout } from 'office-ui-fabric-react/lib/Callout';

const WaffleButton = styled(Box)`
  margin: -12px 0;
  margin-left: 12px;

  &,
  .ms-Button {
    height: 50px;
    width: 50px;
    box-sizing: border-box;
  }

  .ms-Button {
    background-color: ${({ theme }) => theme.palette.themePrimary};

    &:hover {
      background-color: ${({ theme }) => transparentize(0.2, theme.palette.themePrimary)};
    }
  }

  .ms-Button-icon {
    font-size: 28px;
    color: #fff;
  }
`;

const WaffleInnerButton = styled(PrimaryButton)`
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

class HeaderWaffle extends Component {
  constructor() {
    super();
    this.waffleRef = React.createRef();
    this.state = {
      calloutOpen: false,
    };
  }

  toggleCallout = () => this.setState({ calloutOpen: !this.state.calloutOpen });

  render() {
    return (
      <React.Fragment>
        <WaffleButton width={50} ref={this.waffleRef}>
          <CommandBarButton
            name="תפריט"
            iconOnly
            iconProps={{
              iconName: 'Waffle',
            }}
            onClick={this.toggleCallout}
          />
        </WaffleButton>
        {this.state.calloutOpen ? (
          <Callout
            target={this.waffleRef.current}
            onDismiss={this.toggleCallout}
            gapSpace={0}
            setInitialFocus
            beakWidth={10}
            minPagePadding={26}
          >
            <Flex>
              <Link to="/">
                <WaffleInnerButton iconProps={{ iconName: 'MSNVideosSolid' }}>
                  האתר הראשי
                </WaffleInnerButton>
              </Link>
              <Link to="/studio">
                <WaffleInnerButton iconProps={{ iconName: 'MyMoviesTV' }}>סטודיו</WaffleInnerButton>
              </Link>
              <Link to="/mgmt">
                <WaffleInnerButton iconProps={{ iconName: 'AccountManagement' }}>
                  ניהול
                </WaffleInnerButton>
              </Link>
            </Flex>
          </Callout>
        ) : null}
      </React.Fragment>
    );
  }
}

export default HeaderWaffle;
