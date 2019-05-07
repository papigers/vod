import React, { Fragment, Component } from 'react';
import { matchPath } from 'react-router-dom';
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
  position: fixed;
  margin-top: 50px;
  height: calc(100% - 50px);
  z-index: 1000;
`;

const StyledPanel = styled(Panel)`
  .ms-Panel-main {
    width: 240px !important;
  }

  .ms-Panel-main,
  .ms-Button {
    background-color: ${({ theme }) =>
      mix(0.3, theme.palette.white, theme.palette.neutralLighterAlt)};
  }

  .ms-Button:hover {
    background-color: ${({ theme }) => transparentize(0.95, theme.palette.neutralPrimary)};
  }

  .ms-Panel--smLeft {
    width: 250px;
  }

  .ms-Panel-content {
    padding-left: 0;
    padding-right: 0;
  }

  .ms-Overlay {
    background-color: ${({ theme }) => transparentize(0.6, invert(theme.palette.neutralPrimary))};
  }

  .ms-Nav-link a {
    width: 100%;
    text-align: right;
  }
`;

const HeaderContainer = styled.div`
  height: 64px;
  display: flex;
  align-items: center;
  margin-right: 10px;
`;

class Sidebar extends Component {
  onRenderLink = (link, defRender) => {
    return (
      <Link to={link.to}>
        {link.to.indexOf('/channel/') === 0 ? (
          <Persona imageUrl={link.img} size={PersonaSize.size32} text={link.name} key={link.key} />
        ) : (
          defRender(link)
        )}
      </Link>
    );
  };

  render() {
    const { isSidebarTrapped, isSidebarOpen, onDismissed, followedChannels } = this.props;
    const navLinks = [
      { name: 'בית', key: 'home', to: '/' },
      { name: 'חם', to: '/trending', key: 'trending' },
      { name: 'ערוצים', to: '/channels', key: 'channels' },
    ];
    const activeLink = navLinks
      .filter(link => matchPath(link.to, { path: window.location.pathname, exact: true }))
      .map(link => link.key);

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
                  forceFocusInsideTrap: false,
                }}
                layerProps={
                  isSidebarTrapped
                    ? {
                        hostId: 'panelHost',
                      }
                    : null
                }
                isOpen={isSidebarOpen}
                type={PanelType.smallFixedNear}
                onRenderFooterContent={() => '\u00A9 מדור מימ"ד'}
                isFooterAtBottom
                onDismissed={isSidebarTrapped ? null : onDismissed}
                isLightDismiss={true}
                componentRef={panel => {
                  this.panel = panel;
                }}
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
                      links: navLinks,
                    },
                    followedChannels &&
                      followedChannels.length && {
                        name: 'ערוצים במעקב',
                        links: followedChannels.map(channel => ({
                          name: channel.name,
                          to: `/channel/${channel.id}`,
                          key: channel.id,
                          img: `/profile/${channel.id}/profile.png`,
                        })),
                      },
                  ]}
                  expandedStateText={'expanded'}
                  collapsedStateText={'collapsed'}
                  selectedKey={activeLink && activeLink[0]}
                />
              </StyledPanel>
            )}
          </ThemeContext.Consumer>
        ) : null}
      </Fragment>
    );
  }
}

export default Sidebar;
