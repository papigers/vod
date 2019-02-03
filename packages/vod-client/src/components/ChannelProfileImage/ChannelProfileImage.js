import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { PersonaSize, sizeToPixels } from 'office-ui-fabric-react/lib/Persona';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { TooltipHost, TooltipDelay } from 'office-ui-fabric-react/lib/Tooltip';

const Container = styled.div`
  width: ${({ size }) => `${sizeToPixels[size]}px`};
  height: ${({ size }) => `${sizeToPixels[size]}px`};
  border-radius: 50%;
  overflow: hidden;
  position: relative;

  input[type='file'] {
    display: none;
  }
`;

const ProfileImage = styled.div`
  width: 100%;
  height: 100%;
  background-image: url(${({ src }) => `'${src}'`});
  zoom: ${({ scale }) => scale};
  background-position: ${({ position }) => `${position.x}px ${position.y}px`};
  ${({ editing }) =>
    editing
      ? css`
          cursor: move;
          cursor: grab;
          cursor: -moz-grab;
          cursor: -webkit-grab;

          &:active {
            cursor: grabbing;
            cursor: -moz-grabbing;
            cursor: -webkit-grabbing;
          }
        `
      : css`
          cursor: default;
        `};
`;

class ChannelProfileImage extends Component {
  static defaultProps = {
    size: PersonaSize.size48,
  };

  constructor() {
    super();
    this.state = {
      imageWidth: 0,
      imageHeight: 0,
      scale: 1,
      position: {
        x: 0,
        y: 0,
      },
      editing: false,
    };
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    this.getImageSize();
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.src !== prevProps.src) {
      this.setState({
        scale: 1,
        editing: false,
        position: {
          x: 0,
          y: 0,
        },
      });
      this.getImageSize();
    } else if (this.state.scale !== prevState.scale || this.props.size !== prevProps.size) {
      const maxX =
        (this.state.imageWidth * this.state.scale - sizeToPixels[this.props.size]) /
        -this.state.scale;
      const maxY =
        (this.state.imageHeight * this.state.scale - sizeToPixels[this.props.size]) /
        -this.state.scale;
      this.setState({
        position: {
          x: Math.max(maxX, this.state.position.x),
          y: Math.max(maxY, this.state.position.y),
        },
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResizeListener);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  onZoomHandler = e => {
    if (this.state.editing) {
      e.preventDefault();
      const size = sizeToPixels[this.props.size];
      const minScale = Math.max(size / this.state.imageWidth, size / this.state.imageHeight);
      this.setState({
        scale: Math.min(1.5, Math.max(minScale, (e.deltaY <= 0 ? 1 : -1) * 0.1 + this.state.scale)),
      });
    }
  };

  getImageSize() {
    if (this.props.src) {
      const img = new Image();
      img.onload = () => {
        const size = sizeToPixels[this.props.size];
        const minScale = Math.max(size / img.width, size / img.height);
        this.setState({
          imageWidth: img.width,
          imageHeight: img.height,
          scale: minScale,
        });
      };
      img.src = this.props.src;
    }
  }

  toggleEditing = () => {
    if (this.state.editing && this.props.onEditImage) {
      this.props.onEditImage({
        x: this.state.position.x,
        y: this.state.position.y,
        scale: this.state.scale,
      });
    }
    this.setState({ editing: !this.state.editing });
  };

  onMouseDown = e => {
    if (this.state.editing) {
      e.preventDefault();
      this.setState({
        dragging: true,
        mx: null,
        my: null,
      });
    }
  };

  onMouseMove = e => {
    if (!this.state.dragging) {
      return;
    }

    e.preventDefault();

    const position = {
      mx: e.clientX,
      my: e.clientY,
    };

    const maxX =
      (this.state.imageWidth * this.state.scale - sizeToPixels[this.props.size]) /
      -this.state.scale;
    const maxY =
      (this.state.imageHeight * this.state.scale - sizeToPixels[this.props.size]) /
      -this.state.scale;

    if (this.state.mx && this.state.my) {
      position.position = {
        x: Math.max(maxX, Math.min(0, this.state.position.x + position.mx - this.state.mx)),
        y: Math.max(maxY, Math.min(0, this.state.position.y + position.my - this.state.my)),
      };
    }

    this.setState({ ...position });
  };

  onMouseUp = e => {
    if (this.state.dragging) {
      e.preventDefault();
      this.setState({
        dragging: false,
      });
    }
  };

  onFileChange = (...args) => {
    if (this.props.onFileChange) {
      this.props.onFileChange(...args);
    }
  };

  onUploadClick = () => {
    if (this.inputRef && this.inputRef.current) {
      this.inputRef.current.click();
    }
  };

  renderEditTooltip = () => {
    const { editable, src } = this.props;
    const { editing } = this.state;

    return (
      <Flex flexDirection="column" alignItems="center" justifyContent="center">
        {editable && src ? (
          <Box my={1}>
            <DefaultButton
              text={editing ? 'שמור שינויים' : 'מקם תמונה'}
              iconProps={{ iconName: editing ? 'Accept' : 'PicturePosition' }}
              primary={editing}
              onClick={this.toggleEditing}
            />
          </Box>
        ) : null}
        {editable && !editing ? (
          <Box my={1}>
            <DefaultButton
              iconProps={{ iconName: 'Upload' }}
              text="העלה תמונה"
              onClick={this.onUploadClick}
            />
          </Box>
        ) : null}
      </Flex>
    );
  };

  render() {
    const { src, size, editable } = this.props;
    const { editing, dragging, scale, position } = this.state;
    const img = (
      <ProfileImage
        src={src}
        size={size}
        position={position}
        scale={scale}
        editing={editing}
        draggable={editing}
        dragging={dragging}
        onWheel={this.onZoomHandler}
        onMouseDown={this.onMouseDown}
      />
    );
    return (
      <Container size={size}>
        <input ref={this.inputRef} type="file" accept="image/*" onChange={this.onFileChange} />
        {editable ? (
          <TooltipHost
            tooltipProps={{
              onRenderContent: this.renderEditTooltip,
            }}
            calloutProps={{
              isBeakVisible: false,
              gapSpace: -16,
            }}
            delay={TooltipDelay.zero}
            closeDelay={300}
          >
            {img}
          </TooltipHost>
        ) : (
          img
        )}
      </Container>
    );
  }
}

export default ChannelProfileImage;
