import React, { Component } from 'react';
import styled, { css } from 'styled-components';

import { Modal as FabricModal } from 'office-ui-fabric-react';

export const MODAL_SIZE = {
  LARGE: 'MODAL_SIZE_LARGE',
  MEDIUM: 'MODAL_SIZE_MEDIUM',
  SMALL: 'MODAL_SIZE_SMALL',
};

const sizes = {
  [MODAL_SIZE.LARGE]: css`
    height: 80vh;
    width: 80vw;
  `,
  [MODAL_SIZE.MEDIUM]: css`
    height: 60vh;
    width: 60vw;
  `,
  [MODAL_SIZE.SMALL]: css`
    height: 40vh;
    width: 40vw;
  `,
  [MODAL_SIZE.AUTO]: css([]),
};

const StyledModal = styled(FabricModal).attrs(({ theme }) => ({
  isDarkOverlay: theme.name === 'dark',
}))`
  top: -2vh;

  .ms-Dialog-main {
    z-index: 1;

    & > div {
      ${size => (size && sizes[size]) || sizes[MODAL_SIZE.AUTO]}
      max-height: 80vh;
      max-width: 80vw;
      display: flex;
      flex-flow: column nowrap;
      align-items: stretch;
      background: ${({ theme }) => theme.palette.neutralLighterAlt};
      color: ${({ theme }) => theme.palette.neutralDark};
    }
  }
`;

const ModalHeader = styled.div`
  flex: 1 1 auto;
  background: ${({ theme }) => theme.palette.themeDarkAlt};
  color: #fff;
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  padding: 10px 32px;
  min-height: 40px;
`;

const ModalContent = styled.div`
  flex: 4 4 auto;
  padding: 10px 32px;
  overflow-y: auto;
  z-index: 1;
`;

class Modal extends Component {
  render() {
    const { title, isOpen, isBlocking, onDismiss, children, size } = this.props;

    return (
      <StyledModal isOpen={isOpen} onDismiss={onDismiss} isBlocking={isBlocking} size={size}>
        <ModalHeader>{title}</ModalHeader>
        <ModalContent>
          {React.Children.map(children, child => React.cloneElement(child, { onDismiss }))}
        </ModalContent>
      </StyledModal>
    );
  }
}

export default Modal;
