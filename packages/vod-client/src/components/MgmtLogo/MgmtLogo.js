import React, { Fragment } from 'react';
import styled from 'styled-components';
import { transparentize } from 'polished';
import { Link } from 'react-router-dom';
import { Flex, Box } from 'grid-styled';

import { CommandBarButton } from 'office-ui-fabric-react/lib/Button';

import logo from './logo.png';

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
      <WaffleButton width={50} ref={ref}>
        <CommandBarButton
          name="תפריט"
          ref={ref}
          iconOnly
          iconProps={{
            iconName: 'Waffle',
          }}
          onClick={props.toggleCallout}
        />
      </WaffleButton>
      <Link to="/mgmt">
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
