import React, { Fragment } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Flex, Box } from 'grid-styled';

import HeaderWaffle from 'components/HeaderWaffle';

import logo from './logo.png';

const Logo = styled.div`
  height: 32px;

  img {
    max-height: 100%;
    width: auto;
    display: block;
  }
`;

const HeaderTitle = styled.div`
  color: #fff;
  font-size: 26px;
`;

function HeaderLogo(props, ref) {
  return (
    <Fragment>
      <HeaderWaffle />
      <Link to={props.to || '/'}>
        <Flex justifyContent="center" alignItems="center">
          <Logo>
            <img src={logo} alt="Logo" />
          </Logo>
          <Box px={2} />
          <HeaderTitle>VOD</HeaderTitle>
        </Flex>
      </Link>
    </Fragment>
  );
}

export default React.forwardRef(HeaderLogo);
