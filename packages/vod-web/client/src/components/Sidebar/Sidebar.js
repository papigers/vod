import React, { Fragment, Component } from 'react';
import styled from 'styled-components';
import { mix, transparentize, invert } from 'polished';
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import { LayerHost } from 'office-ui-fabric-react/lib/Layer';
import { Nav } from 'office-ui-fabric-react/lib/Nav';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Link } from 'react-router-dom';

import { ThemeContext } from 'theme';
import HeaderLogo from 'components/HeaderLogo';

const PanelHost = styled(LayerHost)`
  position: relative;
  margin-top: 64px;
`;

const StyledPanel = styled(Panel)`
  .ms-Panel-main {
    width: 240px !important;
  }

  .ms-Panel-main, .ms-Button {
    background-color: ${({theme}) => mix(0.3, theme.palette.white, theme.palette.neutralLighterAlt)};
  }

  .ms-Button:hover {
    background-color: ${({theme}) => transparentize(0.95, theme.palette.neutralPrimary)};
  }

  .ms-Panel--smLeft {
    width: 250px;
  }

  .ms-Panel-content {
    padding-left: 0;
    padding-right: 0;
  }

  .ms-Overlay {
    background-color: ${({theme}) => transparentize(0.6, invert(theme.palette.neutralPrimary))}
  }
`;

const HeaderContainer = styled.div`
  height: 64px;
  display: flex;
  align-items: center;
  margin-right: 10px;
`;

export default class Sidebar extends Component {

  onRenderLink = (link, defRender) => {
    return (
      <Link to={link.to}>
        {link.to.indexOf('/channel/') === 0 ? (
          <Persona
            imageUrl={link.img}
            size={PersonaSize.size32}
            text={link.name}
            key={link.key}
          />
        ) : defRender(link)}
      </Link>
    );
  }

  render() {
    const { isSidebarTrapped, isSidebarOpen, onDismissed } = this.props;
    return (
      <Fragment>
        <PanelHost id="panelHost" />
        {isSidebarOpen ? (
          <ThemeContext.Consumer>
            {() => (
              <StyledPanel
                isBlocking={!isSidebarTrapped}
                hasCloseButton={false}
                focusTrapZoneProps={{
                  isClickableOutsideFocusTrap: true,
                  forceFocusInsideTrap: false
                }}
                layerProps={isSidebarTrapped ? {
                  hostId: 'panelHost'
                } : null}
                isOpen={isSidebarOpen}
                type={PanelType.smallFixedNear}
                onRenderFooterContent={() => "\u00A9 מדור מימ\"ד"}
                isFooterAtBottom
                onDismissed={isSidebarTrapped ? null : onDismissed}
                isLightDismiss={true}
                innerRef={panel => { this.panel = panel; }}
              >
                {!isSidebarTrapped ? (
                  <HeaderContainer>
                    <HeaderLogo toggleSidebar={() => this.panel.dismiss()} />
                  </HeaderContainer>
                ) : null}
                <Nav
                  onRenderLink={this.onRenderLink}
                  groups={[
                    {
                      links: [
                        { name: 'בית', key: 'home', to: '/' },
                        { name: 'חם', to: '/trending', key: 'trending' },
                        { name: 'ערוצים', to: '/channels', key: 'channels' },
                      ]
                    }, 
                    {
                      name: 'ערוצים',
                      links: [
                        { name: 'ערוץ 11', to: '/channel/channel11', key: 'channel11', img: 'https://yt3.ggpht.com/-BbwsM-6h7Qg/AAAAAAAAAAI/AAAAAAAAAAA/S-9eysJS6os/s288-mo-c-c0xffffffff-rj-k-no/photo.jpg' },
                        { name: 'ערוץ 12', to: '/channel/channel12', key: 'channel12', img: 'https://yt3.ggpht.com/-6KZQLJ8zEZk/AAAAAAAAAAI/AAAAAAAAAAA/O7YW5jF52Cg/s288-mo-c-c0xffffffff-rj-k-no/photo.jpg' },
                        { name: 'ערוץ 13', to: '/channel/channel13', key: 'channel13', img: 'https://yt3.ggpht.com/-QorRqZfdyFg/AAAAAAAAAAI/AAAAAAAAAAA/rnUbhg0GbJk/s288-mo-c-c0xffffffff-rj-k-no/photo.jpg' },
                        { name: 'ערוץ 10', to: '/channel/channel10', key: 'channel10', img: 'https://yt3.ggpht.com/-6FjpbqWzuV0/AAAAAAAAAAI/AAAAAAAAAAA/E_jXVF6EZ5M/s288-mo-c-c0xffffffff-rj-k-no/photo.jpg' },
                      ]
                    }
                  ]}
                  expandedStateText={'expanded'}
                  collapsedStateText={'collapsed'}
                  selectedKey={'home'}
                />
              </StyledPanel>
            )}
          </ThemeContext.Consumer>
        ) : null}
      </Fragment>
    );
  }
}
