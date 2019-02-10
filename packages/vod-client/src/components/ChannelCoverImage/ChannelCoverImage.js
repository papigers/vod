import React, { Component } from 'react';
import styled from 'styled-components';

import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Shimmer, ShimmerElementType as ElemType } from 'office-ui-fabric-react/lib/Shimmer';
import { Image as FabricImage } from 'office-ui-fabric-react/lib/Image';
import Editor from 'react-avatar-editor';

const PositionButton = styled(DefaultButton)`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1;
  opacity: 0;
  transition: opacity 300ms ease-in-out;

  & + & {
    top: 60px;
  }
`;

const AspectRatioContainer = styled.div`
  width: 100%;
  padding-top: 20%;
  position: relative;

  & ${PositionButton} {
    opacity: ${({ editing }) => (editing ? 1 : 0)};
  }

  &:hover ${PositionButton} {
    opacity: 1;
  }
`;

const InputButton = styled(PositionButton)`
  top: unset !important;
  bottom: 20px !important;

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
  constructor(props) {
    super();
    this.state = {
      imageWidth: 0,
      imageHeight: 0,
      scale: 1,
      editing: false,
      position: {
        x: 0.5,
        y: 0.5,
      },
    };
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.onResizeListener = window.addEventListener('resize', this.onResizeHandler);
    this.getImageSize();
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.src !== prevProps.src) {
      const imageChanged = this.state.croppedImage !== this.props.src;
      this.setState(
        {
          editing: false,
          uploaded: !imageChanged ? this.state.uploaded : null,
        },
        imageChanged ? this.getImageSize : null,
      );
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
      this.setState({
        scale: Math.min(3, Math.max(1, (e.deltaY <= 0 ? 1 : -1) * 0.1 + this.state.scale)),
      });
    }
  };

  getImageSize() {
    if (this.props.src) {
      const img = new Image();
      img.onload = () => {
        this.setState({
          imageWidth: img.width,
          imageHeight: img.height,
          scale: Math.max(1, this.state.scale),
          position: {
            x: 0.5,
            y: 0.5,
          },
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

  onPositionChange = position => this.setState({ position });

  onFileChange = ({ target: input }) => {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = e =>
        this.setState({
          uploaded: e.target.result,
          editing: true,
        });
      reader.readAsDataURL(input.files[0]);
    }
  };

  onSaveFile = () => {
    const croppedImage = this.canvasRef.current.getImage().toDataURL();
    this.setState({ editing: false, croppedImage });
    if (this.props.onFileChange) {
      this.props.onFileChange(croppedImage);
    }
  };

  onCancelEdit = () => {
    this.setState({ editing: false, uploaded: null });
  };

  render() {
    const { src, editable } = this.props;
    const { editing, uploaded, containerWidth, containerHeight, scale, position } = this.state;
    return (
      <AspectRatioContainer editing={editing} ref={this.containerRef} onWheel={this.onZoomHandler}>
        {uploaded ? (
          <PositionButton
            text={editing ? 'שמור שינויים' : 'ערוך תמונה'}
            iconProps={{ iconName: editing ? 'Accept' : 'Move' }}
            primary={editing}
            onClick={editing ? this.onSaveFile : this.toggleEditing}
          />
        ) : null}
        {uploaded && editing ? (
          <PositionButton
            text="ביטול"
            iconProps={{ iconName: 'Cancel' }}
            onClick={this.onCancelEdit}
          />
        ) : null}
        {editable && !editing ? (
          <InputButton iconProps={{ iconName: 'Upload' }} text="העלה תמונה">
            <input type="file" accept="image/*" onChange={this.onFileChange} />
          </InputButton>
        ) : null}
        <AspectRatioItem
          as={Shimmer}
          width="100%"
          shimmerElements={[{ type: ElemType.line, width: '100%', height: '100%' }]}
          isDataLoaded={!!src || (editing && uploaded)}
        >
          {!editing ? (
            <FabricImage
              width="100%"
              src={
                uploaded && this.canvasRef.current
                  ? this.canvasRef.current.getImage().toDataURL()
                  : src
              }
              maximizeFrame
            />
          ) : (
            <Editor
              ref={this.canvasRef}
              image={uploaded}
              border={0}
              width={containerWidth}
              height={containerHeight}
              scale={scale}
              position={position}
              onPositionChange={this.onPositionChange}
            />
          )}
        </AspectRatioItem>
      </AspectRatioContainer>
    );
  }
}

export default ChannelCoverImage;
