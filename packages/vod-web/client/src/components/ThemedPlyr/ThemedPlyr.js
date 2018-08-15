import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import Plyr from 'react-plyr';
import styled from 'styled-components';

import { Icon } from 'office-ui-fabric-react/lib/Icon';

const StyledPlyr = styled.div`
  & {
    .plyr__control--overlaid,
    .plyr--video .plyr__controls .plyr__control.plyr__tab-focus, .plyr--video .plyr__controls .plyr__control:hover,
    .plyr--video .plyr__controls .plyr__control[aria-expanded=true],
    .plyr__menu__container label.plyr__control input[type=radio]:checked+span {
      background-color: ${({theme}) => theme.palette.themeDarkAlt};
    }

    .plyr--full-ui input[type=range] {
      color: ${({theme}) => theme.palette.themeDarkAlt};
    }

    .plyr__menu__container label.plyr__control.plyr__tab-focus input[type=radio]+span, .plyr__menu__container label.plyr__control:hover input[type=radio]+span {
      background: rgba(0,0,0,.1);
    }

    .plyr__control {
      border-radius: 0;
    }

    .plyr__control[data-plyr="fullscreen"] svg {
      width: 26px;
      padding: 0 4px;
      height: 34px;
    }

    .plyr__controls .ms-Icon{
      font-size: 20px;
      width: 30px;
      pointer-events: none;
    }

    .plyr__control--overlaid .ms-Icon {
      font-size: 26px;
      width: 40px;
    }
  }
`;

export default class ThemedPlyr extends Component {
  constructor() {
    super();
    this.state = { playerReady: false };
  }

  customizeButtonIcon = (btn, notPressedClass, pressedClass) => {
    const currentIcons = btn.querySelectorAll('svg');
    currentIcons.forEach(icon => btn.removeChild(icon));
    // if (notPressedClass) {
    //   const notPressedIcon = document.createElement('i');
    //   notPressedIcon.className = notPressedClass;
    //   btn.appendChild(notPressedIcon);
    // }
    // if (pressedClass) {
    //   const pressedIcon = document.createElement('i');
    //   pressedIcon.className = pressedClass;
    //   btn.appendChild(pressedIcon);
    // }
  }

  onReady = () => {
    this.setState({ playerReady: true });
    if (this.props.onReady) {
      this.props.onReady(...arguments);
    }
    if (this.plyr && this.plyr.player) {
      const playButton = this.plyr.player.elements.buttons.play[0];
      this.customizeButtonIcon(playButton, 'icon--not-pressed ms-Icon ms-Icon--Play', 'icon--pressed ms-Icon ms-Icon--Pause');

      const playButtonLarge = this.plyr.player.elements.buttons.play[1];
      this.customizeButtonIcon(playButtonLarge, 'icon--not-pressed ms-Icon ms-Icon--Play');

      const muteButton = this.plyr.player.elements.buttons.mute;
      this.customizeButtonIcon(muteButton, 'icon--not-pressed ms-Icon ms-Icon--Volume3', 'icon--pressed ms-Icon ms-Icon--VolumeDisabled');

      const settingsButton = this.plyr.player.elements.buttons.settings;
      this.customizeButtonIcon(settingsButton, 'ms-Icon ms-Icon--Settings');
    }
  }

  render() {
    return (
      <StyledPlyr>
        <Plyr {...this.props} ref={el => this.plyr = el} onReady={this.onReady} />
        {this.state.playerReady ? (
          <Fragment>
            {ReactDOM.createPortal(
              <Icon iconName="Pause" className="icon--pressed ms-Icon" />,
              this.plyr.player.elements.buttons.play[0]
            )}
            {ReactDOM.createPortal(
              <Icon iconName="Play" className="icon--not-pressed ms-Icon" />,
              this.plyr.player.elements.buttons.play[0]
            )}
            {ReactDOM.createPortal(
              <Icon iconName="Play" className="icon--not-pressed ms-Icon" />,
              this.plyr.player.elements.buttons.play[1]
            )}
            {ReactDOM.createPortal(
              <Icon iconName="Volume3" className="icon--not-pressed ms-Icon" />,
              this.plyr.player.elements.buttons.mute
            )}
            {ReactDOM.createPortal(
              <Icon iconName="VolumeDisabled" className="icon--pressed ms-Icon" />,
              this.plyr.player.elements.buttons.mute
            )}
            {ReactDOM.createPortal(
              <Icon iconName="Settings" className="ms-Icon" />,
              this.plyr.player.elements.buttons.settings
            )}
          </Fragment>
        ) : null}
      </StyledPlyr>
    );
  }
}
