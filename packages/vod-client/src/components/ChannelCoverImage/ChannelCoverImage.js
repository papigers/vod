import React, { Component } from 'react';
import styled, { css } from 'styled-components';

import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Shimmer, ShimmerElementType as ElemType } from 'office-ui-fabric-react/lib/Shimmer';

const PositionButton = styled(DefaultButton)`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1;
  opacity: 0;
  transition: opacity 300ms ease-in-out;
`;

const AspectRatioContainer = styled.div`
  width: 100%;
  padding-top: 20%;
  position: relative;

  &:hover ${PositionButton} {
    opacity: 1;
  }
`;

const InputButton = styled(PositionButton)`
  bottom: 20px;
  top: unset;

  input[type='file'] {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: absolute;
    width: 100%;
    opacity: 0;
    cursor: pointer;
  }
`;

const CoverImage = styled.div`
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

const AspectRatioItem = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  > * {
    height: 100%;
  }
`;

class ChannelCoverImage extends Component {
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
  }

  componentDidMount() {
    this.onResizeListener = window.addEventListener('resize', this.onResizeHandler);
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
    } else if (
      this.state.scale !== prevState.scale ||
      this.state.containerWidth !== prevState.containerWidth ||
      this.state.containerHeight !== prevState.containerHeight
    ) {
      const maxX =
        (this.state.imageWidth * this.state.scale - this.state.containerWidth) / -this.state.scale;
      const maxY =
        (this.state.imageHeight * this.state.scale - this.state.containerHeight) /
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

  onResizeHandler = () => {
    if (this.container) {
      this.setState({
        containerWidth: this.container.clientWidth,
        containerHeight: this.container.clientHeight,
      });
    }
  };

  onZoomHandler = e => {
    if (this.state.editing) {
      e.preventDefault();
      const minScale = Math.max(
        this.state.containerWidth / this.state.imageWidth,
        this.state.containerHeight / this.state.imageHeight,
      );
      this.setState({
        scale: Math.min(3, Math.max(minScale, (e.deltaY <= 0 ? 1 : -1) * 0.1 + this.state.scale)),
      });
    }
  };

  getImageSize() {
    if (this.props.src) {
      const img = new Image();
      img.onload = () => {
        const minScale = Math.max(
          this.state.containerWidth / img.width,
          this.state.containerHeight / img.height,
        );
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

  containerRef = el => {
    this.container = this.container || el;
    this.onResizeHandler();
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
      (this.state.imageWidth * this.state.scale - this.state.containerWidth) / -this.state.scale;
    const maxY =
      (this.state.imageHeight * this.state.scale - this.state.containerHeight) / -this.state.scale;

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

  render() {
    const { src, editable } = this.props;
    const { editing, dragging, scale, position } = this.state;
    return (
      <AspectRatioContainer ref={this.containerRef}>
        {editable && src ? (
          <PositionButton
            text={editing ? 'שמור שינויים' : 'מקם תמונה'}
            iconProps={{ iconName: editing ? 'Accept' : 'PicturePosition' }}
            primary={editing}
            onClick={this.toggleEditing}
          />
        ) : null}
        {editable && !editing ? (
          <InputButton iconProps={{ iconName: 'Upload' }} text="העלה תמונה">
            <input type="file" accept="image/*" onChange={this.props.onFileChange} />
          </InputButton>
        ) : null}
        <AspectRatioItem
          as={Shimmer}
          width="100%"
          shimmerElements={[{ type: ElemType.line, width: '100%', height: '100%' }]}
          isDataLoaded={!!src}
        >
          <CoverImage
            src={src}
            scale={scale}
            position={position}
            editing={editing}
            draggable={editing}
            dragging={dragging}
            onWheel={this.onZoomHandler}
            onMouseDown={this.onMouseDown}
          />
        </AspectRatioItem>
      </AspectRatioContainer>
    );
  }
}

export default ChannelCoverImage;
