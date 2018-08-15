import React, { Fragment } from 'react';
import styled from 'styled-components';
import { StyledCommandBar } from 'components/Header';
import { Link } from 'react-router-dom';

import logo from './logo.png';

const Logo = styled.div`
  height: 40px;

  img {
    max-height: 100%;
    width: auto;
    display: block;
  }
`

export default function HeaderLogo(props) {
  return (
    <Fragment>
      <StyledCommandBar items={[{
        key: 'menu',
        name: 'תפריט',
        iconOnly: true,
        iconProps: {
            iconName: 'CollapseMenu'
        },
        onClick: props.toggleSidebar,
      }]} />
      <Link to="/">
        <Logo>
          <img src={logo} alt="Logo" />
        </Logo>
      </Link>
    </Fragment>
  );
}
